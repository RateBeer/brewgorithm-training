resource "aws_iam_role_policy_attachment" "ecr_access" {
  role       = "${aws_iam_role.default.name}"
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "default" {
  role       = "${aws_iam_role.default.name}"
  policy_arn = "${aws_iam_policy.default.arn}"
}

# Allow the Lambda to create network interfaces for itself
resource "aws_iam_role_policy_attachment" "vpc_access_policy" {
  role       = "${aws_iam_role.default.name}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

