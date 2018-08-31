resource "aws_cloudwatch_log_group" "default" {
  name = "${var.name}-${var.identifier}"

  tags {
    Name    = "${var.name}-${var.identifier}"
    Comment = "Managed by Terraform"
  }
}
