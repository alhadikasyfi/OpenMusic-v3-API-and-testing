const Joi = require('joi');

const PostAuthentication = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});
const PutAuthentication = Joi.object({
  refreshToken: Joi.string().required(),
});
const DeleteAuthentication = Joi.object({
  refreshToken: Joi.string().required(),
});
module.exports = {
  PostAuthentication,
  PutAuthentication,
  DeleteAuthentication,
};
