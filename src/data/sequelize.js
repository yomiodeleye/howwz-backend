import Sequelize from 'sequelize';
import {databaseConfig} from '../config';
const fs = require('fs');

const Op = Sequelize.Op;

const sequelize = new Sequelize(
    databaseConfig.database,
    databaseConfig.username,
    databaseConfig.password,
    {
        dialect: databaseConfig.dialect,
        host: databaseConfig.host,
        //logging: true,
        define: {
            freezeTableName: true
        },
        operatorsAliases: {
            $eq: Op.eq,
            $ne: Op.ne,
            $gte: Op.gte,
            $gt: Op.gt,
            $lte: Op.lte,
            $lt: Op.lt,
            $not: Op.not,
            $in: Op.in,
            $notIn: Op.notIn,
            $is: Op.is,
            $like: Op.like,
            $notLike: Op.notLike,
            $between: Op.between,
            $notBetween: Op.notBetween,
            $and: Op.and,
            $or: Op.or,
        },
        dialectOptions: {
            ssl: {
                key: fs.readFileSync('../certs/client-key.pem'),
                cert: fs.readFileSync('../certs/client-cert.pem'),
                ca: fs.readFileSync('../certs/server-ca.pem'),
            }
        }
    });

export default sequelize;
