resource "aws_security_group" "default" {
  name        = "${var.name}-${var.identifier}"
  description = "Managed by Terraform"
  vpc_id      = "${var.vpc_id}"

  tags {
    Name = "${var.name}-${var.identifier}"
  }
}
