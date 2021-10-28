require('dotenv').config();

/* eslint-disable max-len */

export const port = process.env.PORT || 4000;
export const host = process.env.WEBSITE_HOSTNAME || `localhost:${port}`;
export const url = process.env.SITE_URL; /* From ENV */
export const sitename = process.env.SITENAME;
export const environment = process.env.environment || false;
export const websiteUrl = process.env.WEBSITE_URL;

export const databaseConfig = { /* From ENV */
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DBNAME,
    host: process.env.DATABASE_HOST,
    dialect: process.env.DATABASE_DIALECT || "mysql"
};

export const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourdomain.com';

export const auth = {
    jwt: { secret: process.env.JWT_SECRET || 'Rent ALL' }
};

export const googleMapAPI = '<Your API Key>';

export const serverKey = '<Your Firebase Server Key>';


// SMS verification
export const sms = { /* From ENV */
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNTSID,
    authToken: process.env.TWILIO_AUTHTOKEN,
    phoneNumber: process.env.TWILIO_PHONENUMBER
  }
};

export const payment = { /* From ENV */
    stripe: {
        secretKey: process.env.STRIPE_SECRET,
    }
};
