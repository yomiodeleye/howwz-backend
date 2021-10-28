import AllCurrenciesType from '../../types/AllCurrenciesType';
import { Currencies } from '../../../data/models';

import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
} from 'graphql';

const getCurrencies = {

    type: AllCurrenciesType,

    async resolve({ request }) {

        try{

        const getAllCurrencies = await Currencies.findAll({
            where: {
                isEnable: true
            }
        });

        if (getAllCurrencies && getAllCurrencies.length > 0) {
            return {
                results: getAllCurrencies,
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
            status: 500
            };
        }


    },
};

export default getCurrencies;
