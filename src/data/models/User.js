import DataType from 'sequelize';
import Model from '../sequelize';
import bcrypt from 'bcrypt';

const User = Model.define('User', {

  id: {
    type: DataType.UUID,
    defaultValue: DataType.UUIDV1,
    primaryKey: true,
  },

  email: {
    type: DataType.STRING(255),
    validate: { isEmail: true },
    allowNull: false,
  },

  password: {
    type: DataType.STRING,
    allowNull: false,
  },

  emailConfirmed: {
    type: DataType.BOOLEAN,
    defaultValue: false,
  },

  type: {
    type: DataType.STRING,
  },

  userBanStatus: {
    type: DataType.BOOLEAN,
    defaultValue: null,
  },

  userDeletedAt: {
    type: DataType.DATE,
  }

}, {
    indexes: [
      { fields: ['email'] },
    ],
});

User.prototype.generateHash = function (password) { // eslint-disable-line  
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

export default User;

