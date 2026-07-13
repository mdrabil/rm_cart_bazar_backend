// validations/storeStaff.validation.js
import Joi from "joi";
import { STAFF_USER_ROLE, USER_ROLE } from "../constants/enums.js";

// export const createStaffSchema = Joi.object({
//   store: Joi.string().required(),
//   role: Joi.string()
//     .valid(USER_ROLE.STORE_MANAGER, USER_ROLE.RIDER, USER_ROLE.CHEF, USER_ROLE.STAFF)
//     .required(),

//   userOption: Joi.string().valid("existing", "new").required(),

//   userId: Joi.when("userOption", {
//     is: "existing",
//     then: Joi.string().required(),
//     otherwise: Joi.forbidden()
//   }),

//   newUser: Joi.when("userOption", {
//     is: "new",
//     then: Joi.object({
//       fullName: Joi.string().min(3).required(),
//       mobile: Joi.string().length(10).required(),
//       email: Joi.string().email().optional(),
//       password: Joi.string().min(6).required()
//     }).required(),
//     otherwise: Joi.forbidden()
//   })
// });



export const createStaffSchema = Joi.object({
  store: Joi.string().required(),
  role: Joi.string()
    .valid(...Object.values(STAFF_USER_ROLE))
    .required(),

  userOption: Joi.string().valid("existing", "new").required(),

  userId: Joi.when("userOption", {
    is: "existing",
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  }),

  newUser: Joi.when("userOption", {
    is: "new",
    then: Joi.object({
      fullName: Joi.string().min(3).required(),
      mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
      email: Joi.string().email().optional(),
    }).required(),
    otherwise: Joi.forbidden()
  })
});