data "aws_iam_policy_document" "lambda_and_instance_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com", "lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "default" {
  name = "${var.name}-${var.identifier}"
  description = "Terraform - Lambda & EC2 Role for ${var.name}-${var.identifier}"
  assume_role_policy = "${data.aws_iam_policy_document.lambda_and_instance_assume_role_policy.json}"
}
