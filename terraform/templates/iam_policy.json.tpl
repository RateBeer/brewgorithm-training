{
  "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "LambdaCreateEC2Instance",
            "Effect": "Allow",
            "Action": [
                "ec2:RunInstances",
                "ec2:DescribeImages",
                "ec2:CreateTags"
            ],
            "Resource": [
              "*"
            ]
        },
        {
            "Sid": "LambdaPassRole",
            "Effect": "Allow",
            "Action": [
                "iam:PassRole"
            ],
            "Resource": [
              "arn:aws:iam::${aws_account_id}:role/${self_role_name}"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": [
                "${log_group_arn}"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "ssm:DescribeParameters"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameters"
            ],
            "Resource": [
              "arn:aws:ssm:${aws_region}:${aws_account_id}:parameter${ssm_key_deploy_user}",
              "arn:aws:ssm:${aws_region}:${aws_account_id}:parameter${ssm_key_deploy_token}",
              "arn:aws:ssm:${aws_region}:${aws_account_id}:parameter${ssm_key_db_user}",
              "arn:aws:ssm:${aws_region}:${aws_account_id}:parameter${ssm_key_db_pass}"
            ]
        },
        {
           "Effect":"Allow",
           "Action":[
              "kms:Decrypt"
           ],
           "Resource":[
              "arn:aws:kms:${aws_region}:${aws_account_id}:alias/aws/ssm"
           ]
        }
    ]
}
