// GrpahQL
import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
  } from 'graphql';
  
  import SendMessageType from '../../types/SendMessageType';
  
  // Sequelize models
  import { ThreadItems, Threads } from '../../../data/models';
  
  const readMessage = {
  
    type: SendMessageType,
  
    args: {
      threadId: { type: new NonNull(IntType) }
    },
  
    async resolve({ request, response }, {
      threadId
    }) {

      try{  
  
      // Check if user already logged in
      if (request.user && !request.user.admin) {
  
        const userId = request.user.id;
  
        // Create a thread item
        const threadItems = await ThreadItems.update({
          isRead: true
        }, {
            where: {
              threadId,
              sentBy: {
                $ne: userId
              },
              isRead: false
            }
          }); 
  
        const updateThreads = await Threads.update({
          isRead: true
        }, {
            where: {
              id: threadId,
            }
          });
  
        return {
          status: 200,
          message: 'updated'
        };
      } else {
        return {
          status: 500 ,
          errorMessage: 'You are not loggedIn'
        };
      }
     } catch (error) {
        return {
        errorMessage: 'Something went wrong' + error,
        status: 400
        };
     }
    },
  };
  
  export default readMessage;
  