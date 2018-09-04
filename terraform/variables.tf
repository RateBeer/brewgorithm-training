variable "name" {
  type = "string"

  default = "BrewgorithmTraining"

  description = "This will be added to the name of most resources to keep them unique."
}

variable "identifier" {
  type = "string"

  description = "Unique identifier to add as a suffix to resources."
}

variable "vpc_id" {
  type = "string"

  description = "ID of the VPC to deploy into."
}

variable "ssm_key_deploy_user" {}
variable "ssm_key_deploy_token" {}
variable "ssm_key_db_user" {}
variable "ssm_key_db_pass" {}

