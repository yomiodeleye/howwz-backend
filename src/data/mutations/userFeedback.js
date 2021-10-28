import ReportUserCommonType from '../types/ReportUserCommonType';
import { sendEmail } from '../../libs/sendEmail';
import { adminEmail } from '../../config';

// GrpahQL
import {
    GraphQLString as StringType,
} from 'graphql';

// Models
import { UserProfile } from '../models';

const userFeedback = {

    type: ReportUserCommonType,

    args: {
        type: { type: StringType },
        message: { type: StringType },
    },

    async resolve({ request }, { type, message }) {

        try {

            if (request && request.user) {

                let userId = request.user.id, name;

                const profile = await UserProfile.findOne({
                    where: {
                        userId
                    },
                    raw: true
                });

                if (profile) {
                    name = profile.displayName;
                }

                let content = {
                    type,
                    message,
                    name
                };


                const { status, errorMessge } = await sendEmail(adminEmail, 'userFeedback', content);

                return await {
                    status: 200,
                    errorMessage: errorMessge
                }
            } else {
                return {
                    status: 500,
                    errorMessage: "You are not loggedIn"
                };
            }
        } catch (error) {
            return {
                errorMessage: 'Something went wrong' + error,
                status: 400
            };
        }
    }
};

export default userFeedback;

/*
{
  userFeedback{
    errorMessage
    status
    results{
      id
      isEnable
      countryCode
      countryName
      dialCode
    }
  }
}
*/