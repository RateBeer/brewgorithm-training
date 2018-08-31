data "template_file" "default" {
  template = "${file("${path.module}/templates/iam_policy.json.tpl")}"

  vars {
    self_role_name      = "${aws_iam_role.default.name}"
    aws_region          = "${data.aws_region.current.name}"
    aws_account_id      = "${data.aws_caller_identity.current.account_id}"
    ssm_key_deploy_key  = "${var.ssm_key_deploy_key}"
    ssm_key_db_user     = "${var.ssm_key_db_user}"
    ssm_key_db_pass     = "${var.ssm_key_db_pass}"
    log_group_arn       = "${aws_cloudwatch_log_group.default.arn}"
  }
}

resource "aws_iam_policy" "default" {
  name = "${var.name}-${var.identifier}"
  description = "Terraform - ${var.name}-${var.identifier}"

  policy = "${data.template_file.default.rendered}"
}
