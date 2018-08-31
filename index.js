var AWS = require('aws-sdk');

exports.handler = async (event) => {

  AWS.config.update({region: process.env.REGION_AWS});
  var ec2 = new AWS.EC2();

  var describeImageParams = {
    Filters: [
      {
        Name: 'name',
        Values: [
          'amzn-ami-*.l-amazon-ecs-optimized'
        ]
      }
    ],
    Owners: [
      '591542846629' // Amazon ID
    ]
  };

  var imageId;
  try {
    var response = await ec2.describeImages(describeImageParams).promise()
    imageId = response['Images'][0]['ImageId']
  }
  catch (err) {
      console.log(err);
      return err;
  }

  var userDataScript = `
#!/bin/bash

# Install AWS Tools, Git, jq, & Git lfs
yum install -y unzip git jq
curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"
unzip awscli-bundle.zip
./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws

curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.rpm.sh | sudo bash
sudo yum install -y git-lfs
git lfs install

# Login to ECR
eval $(/usr/local/bin/aws ecr get-login --no-include-email --region ${process.env.ECR_REGION})

mkdir -p /tmp/models

docker run --log-driver awslogs --log-opt awslogs-group=${process.env.LOG_GROUP_NAME} --log-opt awslogs-region=${process.env.CLOUDWATCH_AWS_REGION} -e RATEBEER_DB_HOST=${process.env.RATEBEER_DB_HOST} -e RATEBEER_DB_PORT=${process.env.RATEBEER_DB_PORT} -e RATEBEER_DB_DATABASE=${process.env.RATEBEER_DB_DATABASE} -e SSM_AWS_REGION=${process.env.SSM_AWS_REGION} -e SSM_KEY_RATEBEER_DB_USER=${process.env.SSM_KEY_RATEBEER_DB_USER} -e SSM_KEY_RATEBEER_DB_PASS=${process.env.SSM_KEY_RATEBEER_DB_PASS} -v /tmp/models:/models ${process.env.DOCKER_IMAGE} /bin/bash -c "python3 -m brewgorithm.src.neural.beer2vec.dev.train && cp /service/brewgorithm/models/* /models/"

/usr/local/bin/aws ssm get-parameters --name ${process.env.SSM_KEY_DEPLOY_KEY} --region ${process.env.SSM_AWS_REGION} --with-decryption | jq -r '.Parameters[0].Value' > ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa

# Verified Github key
echo 'github.com ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==' >> ~/.ssh/known_hosts

git clone ${process.env.GIT_REPO} brewgorithm
cd brewgorithm
git checkout dev

cp /tmp/models/* brewgorithm/models/

git add .
git commit -m "Brewgorithm training $(date +%Y-%m-%d)"

# Bug with deploy keys and git lfs: https://github.com/git-lfs/git-lfs/issues/2291#issuecomment-305874747
rm -f .git/hooks/pre-push
git push

shutdown -h now
`

  // Must Base64 encode the user data script
  var userDataEncoded = new Buffer(userDataScript).toString('base64');

  var securityGroupIds = process.env.SECURITY_GROUPS.split(',')

  var runInstanceParams = {
    UserData: userDataEncoded,
    MaxCount: 1,
    MinCount: 1,
    InstanceInitiatedShutdownBehavior: 'terminate',
    IamInstanceProfile: {
      Name: process.env.INSTANCE_PROFILE_NAME
    },
    ImageId: imageId,
    SubnetId: process.env.SUBNET_ID,
    SecurityGroupIds: securityGroupIds,
    InstanceType: 'c5d.xlarge',
    TagSpecifications: [
      {
        ResourceType: "instance", 
        Tags: [
          {
            Key: "Name", 
            Value: "Brewgorithm-Trainer"
          }
        ]
      }
    ]
  }

  try {
    var response = await ec2.runInstances(runInstanceParams).promise()
    console.log(response)
  }
  catch (err) {
    console.log(err);
    return err;
  }
}
