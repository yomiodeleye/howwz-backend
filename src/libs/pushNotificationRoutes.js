var FCM = require('fcm-node');
import { serverKey } from '../config';

// var serverKey = 'AAAAK5aHG3c:APA91bG60ridFhKm7c4uAR-y_zON1wfhHpcgQWmbsU9byWDBky-7h-EEyulelmQq3CyQMOTuR347cmuXgxHruPKuU5THav1-UB440V5mRVbbfzLFZm34CB2APfDApkY7FagkrkZz796Q'; //put your server key here
var fcm = new FCM(serverKey);
import { UserLogin } from '../data/models';

const pushNotificationRoutes = app => {

    app.post('/push-notification', async function (req, res) {

        let notifyContent = {
            "screenType": "message",
            "title": "New Message",
            "userType": "guest",
            "notificationId": 40300,
            "message": "John: dfsgsfdqwertyuiiiio",
            "threadId": "12",
            "guestId": "2",
            "guestName": "john",
            "guestPicture": "kmik",
            "hostId": "123",
            "hostName": "nj j ",
            "hostPicture": "nmim",
            "guestProfileId": "123",
            "hostProfileId": "123"
        };

        // console.log('req', req.body);

        let userId = req.body.userId;
        let content = req.body.content;

        let notificationId = Math.floor(100000 + Math.random() * 900000);
        let deviceId = [];
        content['notificationId'] = notificationId;
        content['content_available'] = true;



        const getdeviceIds = await UserLogin.findAll({
            attributes: ['deviceId', 'deviceType'],
            where: {
                userId: userId
            },
            raw: true
        });

        let androidDevices = [];
        let iOSDevices = [];


        if (getdeviceIds && getdeviceIds.length > 0) {
            // androidDevices = getdeviceIds.filter(o => o.deviceType == 'iOS');
            getdeviceIds.map(async (item) => {
                deviceId.push(item.deviceId);
            })
        };

        var message = {
            registration_ids: deviceId,
            notification: {
                title: content.title,
                body: content.message,
                content_available: true,
                priority: 'high',

            },
            
            data: {
                content: content,
                action_loc_key: null
            }
        };

        fcm.send(message, function (err, response) {
            if (err) {
                console.log("Something has gone wrong!", err);
            } else {
                console.log("Successfully sent with response: ", response);
            }
            res.send({ status: response, errorMessge: err });
        });

    });
};

export default pushNotificationRoutes;