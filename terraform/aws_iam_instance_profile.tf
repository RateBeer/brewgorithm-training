resource "aws_iam_instance_profile" "default" {
  name = "${var.name}-${var.identifier}"
  role = "${aws_iam_role.default.name}"
}
