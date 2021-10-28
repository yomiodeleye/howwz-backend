import CountryData from '../../types/getCountryType';
import { Country } from '../../../data/models';

const getCountries = {

    type: CountryData,

    async resolve({ request }) {
        try {
            const getCountryList = await Country.findAll();
            if (getCountryList) {
                return {
                    results: getCountryList,
                    status: 200
                }
            } else {
                return {
                    status: 400,
                    errorMessage: "Something Went Wrong"
                }
            }
        } catch (error) {
            return {
                errorMessage: 'Something went wrong' + error,
                status: 400
            };
        }
    }
};

export default getCountries;

/*
{
  getCountries{
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