# Menu Executor

Lambda functions that kick off the Menu Dispatchers

## Use-Case

This Lambda function is used to start the Menu Place and Availability Dispatchers - We need these to run on a schedule (Likely once a month).

The lambda function will spin up an EC2 instance, install Docker, and run the dispatcher image as required. The dispatcher image will exit once it has dispatched all messages to the SQS queue, and the script sent to EC2 is configured to shut down the machine after the image has completed - and the instance is configured to terminate on shut down.

## Issues

This solution is definitely a bit of a work-around; and I think it could be replaced in the future. Recently, AWS released Fargate - a way to run ECS tasks without managing and entire cluster. This has been tested as a different solution to solve this problem, by:
 - Creating an ECS task via Terraform for the dispatcher
 - Running this task with Fargate directly

However - this solution falls apart when it comes to CloudWatch Events - which are used as the managed cron schedule. It can kick off ECS tasks; but currently does not have the option to configure VPC and security group settings as you would if starting the task directly from the console. As the dispatchers will require access to our database, which is not publicly exposed and we cannot provide an elastic IP, we are unable to use this currently.

If/When CloudWatch Events supports VPC/Security Groups; then we should be able to axe this entire repository and move everything into the Terraform configuration.

## Deploying

This project is set to deploy using Serverless. The various options are configured in the `serverless.yml` while environment-specific informaiton should be in the `serverless.override.yml` file. As a part of our CI pipeline, the `serverless.override.ENV.yml` file will be renamed for the appropriate environment.
