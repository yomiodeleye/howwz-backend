// GrpahQL
import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
    GraphQLBoolean as BooleanType,
  } from 'graphql';
  import sequelize from '../../sequelize';
  
  import NewThreadsCommonType from '../../types/NewThreadsCommonType';
  import { Threads, ThreadItems, UserProfile, User } from '../../../data/models';
  
  const getThreads = {
  
    type: NewThreadsCommonType,
  
    args: {
      threadType: { type: StringType },
      threadId: { type: IntType },
      currentPage: { type: IntType },
      sortOrder: { type: BooleanType },
    },
  
    async resolve({ request }, { threadType, threadId, currentPage ,sortOrder}) {
      try{
      // Check if user already logged in
      let limit = 10;
      let offset = 0;
      if(currentPage){
        offset = (currentPage - 1) * limit;
      }
      if (request.user || request.user.admin) {
        let where = {};
        let orderedThreadItem = [];

        const userData = await User.findOne({
          attributes: [
            'userBanStatus'
          ],
          where: { id: request.user.id },
          raw: true
        })

        if (userData) {
          if (userData.userBanStatus == 1) {
            return {
              errorMessage: 'You have blocked, Please contact support team.',
              status: 500
            }
          }
        }

        if (!request.user.admin) {
          // For Getting Specific type of threads of a logged in user(Either 'host' or 'guest')
          if (threadType === 'host') {
            where = {
              host: request.user.id
            }
          } else {
            where = {
              guest: request.user.id
            }
          }
        }
        // For Getting Specific Thread
        if (threadId != undefined && threadId != null) {
          where = Object.assign({}, where, { id: threadId });
        }

        let results = await Threads.findOne({ where });
        let count = await ThreadItems.count({ where: { threadId: threadId } });
        if(!results){
          return {
            errorMessage: 'Something went wrong',
            status: 400
           }
        }else{
          let threadItems;
          if(sortOrder){
            threadItems =  ThreadItems.findAll({
              where: { threadId: threadId },
              order: [
                [`createdAt`, `DESC`],
              ],
              limit,
              offset
            }).then(items => {
              orderedThreadItem = items;
              orderedThreadItem.sort((a,b) => (a.createdAt > b.createdAt) ? 1 : ((b.createdAt > a.createdAt) ? -1 : 0));
              return orderedThreadItem;
            });
          }else{
             threadItems =  ThreadItems.findAll({
              where: { threadId: threadId },
              order: [
                [`createdAt`, `DESC`],
              ],
              limit,
              offset
            }).then(items => {
              orderedThreadItem = items;
              return orderedThreadItem;
            });
          }
          

         let hostProfile = await UserProfile.findOne({ where: { userId: results.host } });
         let guestProfile = await UserProfile.findOne({ where: { userId: results.guest } });
          
          if(threadItems){
            return {
              status:200,
              results: {
                listId: results.listId,
                guest: results.guest,
                threadItems: threadItems,
                guestProfile: guestProfile,
                hostProfile: hostProfile,
                getThreadCount: count
              },
              
            }
          }
          else{
            return {
            errorMessage: 'Something went wrong',
            results: results,
            status: 400
            }
          }
       }
      } else {
        return {
          errorMessage: 'You are not LoggedIn',
          status: 500
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
  
  export default getThreads;
  