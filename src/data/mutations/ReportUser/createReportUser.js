import ReportUserCommonType from '../../types/ReportUserCommonType';
import { ReportUser, UserProfile, User } from '../../../data/models';

import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
    GraphQLObjectType as ObjectType,
} from 'graphql';


const CreateReportUser = {

    type: ReportUserCommonType,

    args: {
        reporterId: { type: StringType },
        userId: { type: StringType },
        reportType: { type: StringType },
        profileId: { type: IntType },
    },

    async resolve({ request }, {
        reporterId,
        reportType,
        profileId,
        userId,
    }) {

        try{

        const checkUser = await User.findOne({
            where: { id : reporterId, 
                     $or: [
                        {
                            userBanStatus: 0
                        },
                        {
                            userBanStatus: null
                        }
                    ]  }
        });

        if(checkUser){
            const getUser = await UserProfile.findOne({
                where: {
                    profileId
                }
            });
            userId = getUser.userId;
    
            if (request.user && !request.user.admin == true) {
    
                const createReport = await ReportUser.create({
                    reporterId: reporterId,
                    userId: userId,
                    reportType: reportType,
                })
    
                return {
                    status: 200,
                }
            } else {
                return {
                    status: 500,
                    errorMessage: "You are not LoggedIn"
                }
            }
        }
        else{
            return {
                status: 500,
                errorMessage: "Invalid reporterId.Banned User"
            }

        }

        
        } catch(error) {
            return {
                errorMessage: 'Something went wrong! ' + error,
                status: 400
            }
        }

    },
};

export default CreateReportUser;
