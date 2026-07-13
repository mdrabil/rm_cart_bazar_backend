import moment from "moment";
import { config } from "../config/config.js";

export const formatDate = (date) => {
  return moment(date).format(config.dateFormat);
};
