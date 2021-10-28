// GrpahQL
import {
  GraphQLList as List,
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLNonNull as NonNull,
} from 'graphql';

import ThreadItemsType from '../../types/ThreadItemsType';

// Sequelize models
import { Threads, ThreadItems, ListBlockedDates, UserProfile, User } from '../../../data/models';
import moment from 'moment';
import { sendEmail } from '../../../libs/sendEmail';
import EnquiryType from '../../types/EnquiryType';
import { sendNotifications } from '../../../helpers/sendNotifications';

const CreateEnquiry = {

  type: EnquiryType,

  args: {
    listId: { type: new NonNull(IntType) },
    hostId: { type: new NonNull(StringType) },
    content: { type: new NonNull(StringType) },
    userId: { type: new NonNull(StringType) },
    type: { type: StringType },
    startDate: { type: new NonNull(StringType) },
    endDate: { type: new NonNull(StringType) },
    personCapacity: { type: IntType },
  },

  async resolve({ request, response }, {
    listId,
    hostId,
    content,
    userId,
    type,
    startDate,
    endDate,
    personCapacity
  }) {

    try {

      // Check if user already logged in
      if (request.user) {

        const checkAvailableDates = await ListBlockedDates.findAll({
          where: {
            listId,
            blockedDates: {
              $between: [startDate, endDate]
            }
          }
        });

        let isBlocked = checkAvailableDates && checkAvailableDates.length > 0 ? checkAvailableDates.filter(o => o.calendarStatus == "blocked") : [];

        let notifyUserId, notifyGuestId, notifyHostId, notifyUserType;
        let userName, messageContent;

        if (isBlocked && isBlocked.length > 0) {
          return {
            status: 400,
            errorMessage: 'Something went wrong. Dates are not available'
          }
        } else {
          // Check if a thread is already there or create a new one
          const thread = await Threads.findOrCreate({
            where: {
              listId,
              host: hostId,
              guest: userId,
            },
            defaults: {
              //properties you want on create
              listId,
              host: hostId,
              guest: userId,
            }
          });

          if (thread) {
            // Create a thread item
            const threadItems = await ThreadItems.create({
              threadId: thread[0].dataValues.id,
              sentBy: userId,
              content,
              type,
              startDate,
              endDate,
              personCapacity
            });
            if (threadItems) {
              const updateThreads = await Threads.update({
                isRead: false
              },
                {
                  where: {
                    id: thread[0].dataValues.id
                  }
                }
              );

              const getThread = await Threads.findOne({
                where: {
                  id: thread[0].dataValues.id
                },
                raw: true
              });

              if (getThread && getThread.host && getThread.guest) {
                notifyUserId = getThread.host === userId ? getThread.guest : getThread.host;
                notifyUserType = getThread.host === userId ? 'guest' : 'host';
                notifyGuestId = getThread.host === userId ? getThread.guest : getThread.host;
                notifyHostId = getThread.host === userId ? getThread.host : getThread.guest;
              }

              const hostProfile = await UserProfile.findOne({
                where: {
                  userId: hostId
                }
              });

              const hostEmailDetail = await User.findOne({
                where: {
                  id: hostId
                },
                raw: true
              });

              const guestProfile = await UserProfile.findOne({
                where: {
                  userId
                }
              });


              if (guestProfile && getThread) {
                userName = (guestProfile && guestProfile.displayName) ? guestProfile.displayName : guestProfile.firstName
                // getThread.host === userId ? (guestProfile && guestProfile.displayName) : (hostProfile && hostProfile.displayName);
              }

              messageContent = userName + ': ' + content;

              let emailContent = {
                receiverName: hostProfile.dataValues.firstName,
                senderName: guestProfile.dataValues.firstName,
                type: 'host',
                message: content,
                threadId: thread[0].dataValues.id,
                checkIn: startDate,
                checkOut: endDate,
                personCapacity
              };

              let notifyContent = {
                "screenType": "message",
                "title": "New Enquiry",
                "userType": notifyUserType.toString(),
                "message": messageContent.toString(),
                "threadId": (thread[0].dataValues.id).toString(),
                "guestId": notifyGuestId.toString(),
                "guestName": guestProfile && ((guestProfile.displayName).toString()),
                "guestPicture": (guestProfile && guestProfile.picture) ? ((guestProfile.picture).toString()) : '',
                "hostId": notifyHostId.toString(),
                "hostName": hostProfile && ((hostProfile.displayName).toString()),
                "hostPicture": (hostProfile && hostProfile.picture) ? ((hostProfile.picture).toString()) : '',
                "guestProfileId": guestProfile && ((guestProfile.profileId).toString()),
                "hostProfileId": hostProfile && ((hostProfile.profileId).toString()),
                "listId": listId.toString()
              };

        
              sendNotifications(notifyContent, notifyUserId);

              const { status, response } = await sendEmail(hostEmailDetail.email, 'inquiry', emailContent);

              return {
                result: {
                  id: threadItems.dataValues.id,
                  sentBy: threadItems.dataValues.sentBy,
                  content: threadItems.dataValues.content,
                  type: threadItems.dataValues.type,
                  personCapacity: threadItems.dataValues.personCapacity,
                  startDate: moment(moment(threadItems.dataValues.startDate)).format('MM-DD-YYYY'),
                  endDate: moment(moment(threadItems.dataValues.endDate)).format('MM-DD-YYYY'),
                  createdAt: moment(moment(threadItems.dataValues.createdAt)).format('MM-DD-YYYY'),
                },
                status: 200,
              };

            } else {
              return {
                status: 400,
                errorMessage: 'Something went wrong.Cannot create thread items'
              }
            }
          } else {
            return {
              status: 400,
              errorMessage: "Something went wrong.Cannot create a thread"
            }
          }
        }
      } else {
        return {
          status: 500,
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

export default CreateEnquiry;

/**
mutation CreateEnquiry($listId: Int!, $hostId: String!, $content: String!, $userId: String!, $type: String, $startDate: String!, $endDate: String!, $personCapacity: Int) {
  CreateEnquiry(listId: $listId, hostId: $hostId, userId: $userId, content: $content, type: $type, startDate: $startDate, endDate: $endDate, personCapacity: $personCapacity) {
    id
    sentBy
    content
    type
    startDate
    endDate
    personCapacity
    createdAt
    status
  }
}

**/
