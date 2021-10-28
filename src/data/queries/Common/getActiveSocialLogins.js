import socialLoginsType from '../../types/socialLoginsType';

const getActiveSocialLogins = {
    type: socialLoginsType,

    async resolve({ request, response }) {
        try {
            return {
                status: 200,
                results: {
                    facebook: false,
                    google: false
                }
            };
        } catch (error) {
            return {
                errorMessage: 'Something went wrong.' + error,
                status: 400
            }
        }
    }
};

export default getActiveSocialLogins;

/*

query {
    getActiveSocialLogins {       
        status
        errorMessage
        results {
            facebook
            google
        }
    }
}

*/