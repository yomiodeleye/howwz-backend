// GrpahQL
import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
    GraphQLFloat as FloatType,
} from 'graphql';

import ReviewCommonType from '../../types/ReviewCommonType';

// Sequelize models
import { Reviews, UserProfile } from '../../models';

const userReviews = {

    type: ReviewCommonType,

    args: {
        ownerType: { type: StringType },
        currentPage: { type: IntType },
        profileId: { type: IntType },
    },

    async resolve({ request, response }, { ownerType, currentPage, profileId }) {
        try{

        let limit = 10;
        let offset = 0;
        if(currentPage){
            offset = (currentPage - 1) * limit;
        }

        let userId;
        if (profileId) {
            const getUser = await UserProfile.findOne({
                where: {
                    profileId
                }
            });
            userId = getUser.userId;
        } else {
            if (request.user && !request.user.admin) {
                userId = request.user.id;
            }
        }

        let where = {};
        if (ownerType === 'me') {
            where = {
                authorId: userId
            };
        } else {
            where = {
                userId
            };
        }

        let reviewData =  await Reviews.findAll({
            where,
            limit,
            offset
        });

        if(reviewData.length > 0){
            return {
                status: 200,
                results : reviewData
            }
        }
        else{
            return {
                status: 400,
                errorMessage: 'Something went wrong'
            }
        }
        
        } catch(error) {
            return {
                errorMessage: 'Something went wrong'+ error,
                status: 400
            }
        }
    },
};

export default userReviews;