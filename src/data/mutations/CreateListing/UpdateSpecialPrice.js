// GrpahQL
import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
    GraphQLBoolean as BooleanType,
    GraphQLFloat as FloatType,
} from 'graphql';
import moment from 'moment';
import sequelize from 'sequelize';

// GraphQL Type
import ListBlockedDatesResponseType from '../../types/ListBlockedDatesType';

// Sequelize models
import {
    Listing,
    ListBlockedDates
} from '../../../data/models';

const UpdateSpecialPrice = {

    type: ListBlockedDatesResponseType,

    args: {
        listId: { type: new NonNull(IntType) },
        blockedDates: { type: new List(StringType) },
        calendarStatus: { type: StringType },
        isSpecialPrice: { type: FloatType }
    },

    async resolve({ request, response }, {
        listId,
        blockedDates,
        calendarStatus,
        isSpecialPrice
    }) {

        try {

            // Check whether user is logged in
            if (request.user || request.user.admin) {

                let where = { listId };
                if (!request.user.admin) {
                    where = {
                        listId,
                        userId: request.user.id
                    }
                };

                // Confirm whether the Listing Id is available
                const isListingAvailable = await Listing.findById(listId);
                let isValue = false;

                if (isListingAvailable) {
                    if (blockedDates) {
                        // const blockedDatesData = await ListBlockedDates.findAll({
                        //     where: {
                        //         listId,
                        //         reservationId: {
                        //             $eq: null
                        //         }
                        //     }
                        // });

                        // Remove all the blocked dates except reservation dates
                        // const removeBlockedDates = await ListBlockedDates.destroy({
                        //     where: {
                        //         listId,
                        //         reservationId: {
                        //             $eq: null
                        //         }
                        //     }
                        // });

                        // if (blockedDatesData.length > 0) {
                        //     console.log('inside dataaafmdskfjdskfj');

                        //     let blockedDatesItems = [];
                        //     blockedDatesData.map((item, key) => {
                        //         blockedDatesItems[key] = new Date(item.blockedDates);
                        //     });


                        //     blockedDates.map(async (item, key) => {
                        //         let day = new Date(item);
                        //         let blockedItem = blockedDatesItems.map(Number).indexOf(+day);
                        //         if (blockedItem > -1) {
                        //             let createRecord = await ListBlockedDates.findOrCreate({
                        //                 where: {
                        //                     listId,
                        //                     blockedDates: item,
                        //                     // calendarId: blockedDatesData[blockedItem].calendarId,
                        //                     calendarStatus: calendarStatus,
                        //                     isSpecialPrice: isSpecialPrice,
                        //                 },
                        //                 defaults: {
                        //                     //properties you want on create
                        //                     listId,
                        //                     blockedDates: new Date(item),
                        //                     // calendarId: blockedDatesData[blockedItem].calendarId
                        //                     // calendarStatus: calendarStatus,
                        //                     // isSpecialPrice: isSpecialPrice,
                        //                 }
                        //             });
                        //         } else {
                        //             let createRecord = await ListBlockedDates.findOrCreate({
                        //                 where: {
                        //                     listId,
                        //                     blockedDates: item,
                        //                     calendarStatus: calendarStatus,
                        //                     isSpecialPrice: isSpecialPrice,
                        //                 },
                        //                 defaults: {
                        //                     //properties you want on create
                        //                     listId,
                        //                     blockedDates: new Date(item),
                        //                     // calendarStatus: calendarStatus,
                        //                     // isSpecialPrice: isSpecialPrice,
                        //                 }
                        //             });
                        //         }
                        //     });
                        //     isValue = true;
                        // } else {
                        //     console.log('inside twooooo');

                        //     blockedDates.map(async (item, key) => {
                        //         let updateBlockedDates = await ListBlockedDates.findOrCreate({
                        //             where: {
                        //                 listId,
                        //                 blockedDates: item,
                        //                 calendarStatus: calendarStatus,
                        //                 isSpecialPrice: isSpecialPrice,
                        //             },
                        //             defaults: {
                        //                 //properties you want on create
                        //                 listId,
                        //                 blockedDates: new Date(item),
                        //                 // calendarStatus: calendarStatus,
                        //                 // isSpecialPrice: isSpecialPrice,
                        //             }
                        //         });
                        //     });
                        //     isValue = true;
                        // }

                        // if (isValue) {
                        //     const listBlockedData = await ListBlockedDates.findAll({
                        //         where: {
                        //             listId
                        //         },
                        //         raw: true
                        //     });
                        // return {
                        //     results: listBlockedData,
                        //     status: 200
                        // }
                        // }

                        let day;
                        let itemValue;
                        await Promise.all(blockedDates.map(async (item, key) => {
                            day = moment(item).format('YYYY-MM-DD');
                            //let blockedDatesFind =  sequelize.fn('DATE',sequelize.col('blockedDates'), day);

                            let dayList = sequelize.where(sequelize.fn('DATE', sequelize.col('blockedDates')), day);
                           

                            let blockedDatesFind = await ListBlockedDates.findAll({
                                //attributes: ['id', 'blockedDates'],
                                where: {
                                    blockedDates: dayList,
                                    listId: listId
                                }
                            })
                            

                            // let blockedDatesFind = await ListBlockedDates.findAll({
                            //     where: sequelize.where(sequelize.fn('DATE',
                            //         sequelize.col('blockedDates')), day)
                            // });

                            
                            if (blockedDatesFind && blockedDatesFind.length > 0) {

                                itemValue = item;
                                await Promise.all(blockedDatesFind.map(async (value, keys) => {

                                    if (itemValue === value.blockedDates) {
                                        //console.log('item value 1st', itemValue)
                                    } else {
                                   

                                        const updateDates = await ListBlockedDates.update({
                                            listId,
                                            blockedDates: value.blockedDates,
                                            isSpecialPrice: isSpecialPrice,
                                            calendarStatus: calendarStatus,
                                        },
                                            {
                                                where: {
                                                    listId,
                                                    blockedDates: value.blockedDates
                                                }
                                            });
                                    }
                                }));

                                
                            }

                            if (blockedDatesFind.length == 0) {
                                

                                let updateBlockedDates = await ListBlockedDates.findOrCreate({
                                    where: {
                                        listId,
                                        blockedDates: item,
                                        calendarStatus: calendarStatus,
                                        isSpecialPrice: isSpecialPrice,
                                    },
                                    defaults: {
                                        //properties you want on create
                                        listId,
                                        //blockedDates: new Date(item),
                                        blockedDates: item,
                                        calendarStatus: calendarStatus,
                                        isSpecialPrice: isSpecialPrice,
                                    }
                                });
                            }

                            if(calendarStatus == 'available' && isSpecialPrice == null) {
                            
                                let blockedDatesData = await ListBlockedDates.destroy({
                                    where: {
                                        listId,
                                        reservationId: {
                                            $eq: null
                                        },
                                        blockedDates: dayList
                                    }
                                });
                            }

                        }));
                        


                        const listBlockedData = await ListBlockedDates.findAll({
                            where: {
                                listId
                            },
                            raw: true
                        });

                        return {
                            results: listBlockedData,
                            status: 200
                        }

                    } else {
                        return {
                            status: 400,
                            errorMessage: 'Please select dates'
                        }
                    }
                } else {
                    return {
                        status: 400,
                        errorMessage: 'Please send correct list id'
                    }
                }


            } else {
                return {
                    status: 500,
                    errorMessage: 'Not a logged user'
                }
            }
        } catch (error) {
            return {
                status: 400,
                errorMessage: 'Something went wrong' + error
            };
        }

    },

};

export default UpdateSpecialPrice;


/*
mutation (
    $listId: Int!,
    $blockedDates: [String]
) {
    UpdateSpecialPrice (
        listId: $listId,
        blockedDates: $blockedDates
    )
    {
        status
    }
}
*/