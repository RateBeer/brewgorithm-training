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

GIT_HTTPS_USER=$(/usr/local/bin/aws ssm get-parameters --name ${process.env.SSM_KEY_GIT_HTTPS_USER} --region ${process.env.SSM_AWS_REGION} --with-decryption | jq -r '.Parameters[0].Value')
GIT_HTTPS_TOKEN=$(/usr/local/bin/aws ssm get-parameters --name ${process.env.SSM_KEY_GIT_HTTPS_TOKEN} --region ${process.env.SSM_AWS_REGION} --with-decryption | jq -r '.Parameters[0].Value')



# https://github.com/git-lfs/git-lfs/blob/5703b808220103063ededf5c6149c93201be9e07/docs/api/authentication.md#specified-in-url
# We must use an HTTPS token with a machine user:
# https://developer.github.com/v3/guides/managing-deploy-keys/#machine-users
git clone https://${GIT_HTTPS_USER}:${GIT_HTTPS_TOKEN}@${process.env.GIT_REPO_BASE} brewgorithm
cd brewgorithm
git checkout dev

cp /tmp/models/* brewgorithm/models/

git add .
git commit -m "Brewgorithm training $(date +%Y-%m-%d)"
git commit --amend --author="Brewgorithm Traininer <root@brewgorithmtrainer>" --no-edit
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
