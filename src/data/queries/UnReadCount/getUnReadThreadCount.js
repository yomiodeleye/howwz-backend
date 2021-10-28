import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
  } from 'graphql';

  import { Threads, ThreadItems, User } from '../../models';
  import UnReadCountType from '../../types/UnReadCountType';

  const getUnReadThreadCount = {

    type: UnReadCountType,
    args: {
        threadId: { type: IntType },
      },

    async resolve({request},{threadId}) {

        try{
    	// Check if user already logged in
	    if(request.user && !request.user.admin) {
        const msgCount = await Threads.count({ 
          where: {        
            id: threadId            
          },
          include: [{
            model: ThreadItems,
            as: 'threadItems',
            require: true,
            where: {
              sentBy: {
                  $ne: request.user.id 
              },
              isRead: false
            },
             order: [['isRead', 'ASC']] 
          }]
        });

          if(msgCount > 0 ){
            return {
              status: 200,
              results: {
                isUnReadMessage: true,
                messageCount: msgCount
              }
            }
          }
          else{
            return {
              status: 200,
              results: {
                isUnReadMessage: false,
                messageCount: msgCount
              }
          }
          };

	    } else {
	    	return {
                status: 500,
                errorMessage: 'Currently, you are not logged in.',
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

export default getUnReadThreadCount;
  