import BillingType from '../../types/BillingType';

import { ListBlockedDates, ListingData, ServiceFees, CurrencyRates, Currencies } from '../../../data/models';

import moment from 'moment';

import { convert } from '../../../helpers/currencyConvertion';

import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
} from 'graphql';

const getBillingCalculation = {

    type: BillingType,

    args: {
        listId: { type: new NonNull(IntType) },
        startDate: { type: new NonNull(StringType) },
        endDate: { type: new NonNull(StringType) },
        guests: { type: new NonNull(IntType) },
        convertCurrency: { type: new NonNull(StringType) }
    },

    async resolve({ request }, { listId, startDate, endDate, guests, convertCurrency }) {

        let momentStartDate, momentEndDate, dayDifference, priceForDays, discount, discountType, total, serviceFee;
        let hostServiceFee, guestServiceFee, weeklyDiscountPercentage = 0, monthlyDiscountPercentage = 0;
        let subtotal = 0, rates, ratesData = {}, convertedAmount = 0, convertedPriceForDays = 0, isMaxNight = false;
        let convertGuestServiceFee = 0, convertCleaningPrice = 0, convertDiscount = 0, convertHostFee = 0, isMinNight = false;
        let result = [], guestErrorMessage, convertedMonthlyDiscountPercentage = 0, convertedWeeklyDiscountPercentage = 0;
        const listingData = await ListingData.findOne({
            where: {
                listId
            }
        });

        if (listingData.maxNight && listingData.maxNight > 0) {
            momentStartDate = new Date(startDate);
            momentEndDate = new Date(endDate);
            dayDifference = moment(moment(momentEndDate)).diff(moment(moment(momentStartDate)), 'days');

            if (dayDifference > listingData.maxNight) {
                isMaxNight = true;
            }
        }

        if (listingData.minNight && listingData.minNight > 0) {
            momentStartDate = new Date(startDate);
            momentEndDate = new Date(endDate);
            dayDifference = moment(moment(momentEndDate)).diff(moment(moment(momentStartDate)), 'days');

            if (dayDifference < listingData.minNight) {
                isMinNight = true;
            }
        }

        try {

            if (!guests) {
                return {
                    status: 400,
                    errorMessage: 'Guests Count Cannot be zero'
                }
            }

            if (isMaxNight || isMinNight) {
                if (isMaxNight) {
                    return {
                        status: 400,
                        errorMessage: 'Maximum allowed Night is ' + listingData.maxNight
                    }
                } else {
                    return {
                        status: 400,
                        errorMessage: 'Minimum allowed Night is ' + listingData.minNight
                    }
                }
            } else {

                let convertStartDate = new Date(startDate);
                convertStartDate.setHours(0, 0, 0, 0);
                let convertEndDate = new Date(endDate);
                convertEndDate.setHours(23, 59, 59, 999);

                const checkAvailableDates = await ListBlockedDates.findAll({
                    where: {
                        listId,
                        blockedDates: {
                            $between: [convertStartDate, convertEndDate]
                        }
                    }
                });

                // Get Service fee Settings
                const serviceFees = await ServiceFees.findOne();

                // Get List data for Listings

                if (checkAvailableDates && checkAvailableDates.length > 0) {
                    return {
                        status: 400,
                        errorMessage: 'Dates Not Available'
                    }
                } else {
                    const data = await CurrencyRates.findAll();
                    const base = await Currencies.findOne({ where: { isBaseCurrency: true } });
                    if (data) {
                        data.map((item) => {
                            ratesData[item.dataValues.currencyCode] = item.dataValues.rate;
                        })
                    }
                    rates = ratesData;

                    if (listingData) {
                        if (startDate != null && endDate != null) {
                            momentStartDate = new Date(startDate);
                            momentEndDate = new Date(endDate);
                            // momentStartDate = moment(moment(startDate));
                            // momentEndDate = moment(moment(endDate));
                            dayDifference = moment(moment(momentEndDate)).diff(moment(moment(momentStartDate)), 'days');
                            priceForDays = Number(listingData.basePrice) * Number(dayDifference);
                            discount = 0;
                            discountType = null;
                            total = 0;
                            weeklyDiscountPercentage = listingData.weeklyDiscount > 0 ? listingData.weeklyDiscount : 0;
                            monthlyDiscountPercentage = listingData.monthlyDiscount > 0 ? listingData.monthlyDiscount : 0;
                        }

                        // if (priceForDays > 0) {
                        //     convertedPriceForDays = convert(base.symbol, rates, priceForDays, listingData.currency, convertCurrency);
                        // }

                        // if (monthlyDiscountPercentage > 0) {
                        //     convertedMonthlyDiscountPercentage = convert(base.symbol, rates, monthlyDiscountPercentage, listingData.currency, convertCurrency);
                        // }

                        // if (weeklyDiscountPercentage > 0) {
                        //     convertedWeeklyDiscountPercentage = convert(base.symbol, rates, weeklyDiscountPercentage, listingData.currency, convertCurrency);
                        // }

                        // if (dayDifference >= 7) {
                        //     console.log('inside day difference...');

                        //     if (convertedMonthlyDiscountPercentage > 0 && dayDifference >= 28) {
                        //         discount = (Number(convertedPriceForDays) * Number(convertedMonthlyDiscount)) / 100;
                        //         discountType = convertedMonthlyDiscountPercentage + "% " + "monthly price discount";
                        //     } else {
                        //         discount = (Number(convertedPriceForDays) * Number(convertedWeeklyDiscountPercentage)) / 100;
                        //         discountType = convertedWeeklyDiscountPercentage + "% " + "weekly price discount";
                        //     }

                        //     console.log('inside day difference... convertedMonthlyDiscountPercentage', convertedMonthlyDiscountPercentage);
                        //     console.log('inside day difference... convertedWeeklyDiscountPercentage', convertedWeeklyDiscountPercentage);
                        //     console.log('inside day difference... discount', discount, discountType);
                        //     console.log('inside day difference... priceForDays', priceForDays, convertedPriceForDays);
                        // }

                        if (dayDifference >= 7) {
                            if (monthlyDiscountPercentage > 0 && dayDifference >= 28) {
                                discount = (Number(priceForDays) * Number(monthlyDiscountPercentage)) / 100;
                                discountType = monthlyDiscountPercentage + "% " + "monthly price discount";
                            } else {
                                discount = (Number(priceForDays) * Number(weeklyDiscountPercentage)) / 100;
                                discountType = weeklyDiscountPercentage + "% " + "weekly price discount";
                            }
                        }

                        if (serviceFees) {
                            if (serviceFees.guestType === 'percentage') {
                                guestServiceFee = priceForDays * (Number(serviceFees.guestValue) / 100);
                            } else {
                                guestServiceFee = convert(base.symbol, rates, serviceFees.guestValue, serviceFees.currency, convertCurrency);
                            }

                            if (serviceFees.hostType === 'percentage') {
                                hostServiceFee = priceForDays * (Number(serviceFees.hostValue) / 100);
                            } else {
                                hostServiceFee = convert(base.symbol, rates, serviceFees.hostValue, serviceFees.currency, convertCurrency);
                            }
                        }

                        if (priceForDays > 0) {
                            convertedPriceForDays = convert(base.symbol, rates, priceForDays, listingData.currency, convertCurrency);
                        }

                        if (guestServiceFee > 0  && serviceFees.guestType === 'percentage') {
                            convertGuestServiceFee = convert(base.symbol, rates, guestServiceFee, listingData.currency, convertCurrency);
                        }
                        if (guestServiceFee > 0  && serviceFees.guestType === 'fixed') {
                            convertGuestServiceFee = guestServiceFee;
                        }

                        if (listingData.cleaningPrice > 0) {
                            convertCleaningPrice = convert(base.symbol, rates, listingData.cleaningPrice, listingData.currency, convertCurrency);
                        }

                        if (discount > 0) {
                            convertDiscount = convert(base.symbol, rates, discount, listingData.currency, convertCurrency);
                        }

                        if (hostServiceFee > 0 && serviceFees.hostType === 'percentage') {
                            convertHostFee = convert(base.symbol, rates, hostServiceFee, listingData.currency, convertCurrency);
                        }
                        if (hostServiceFee > 0 && serviceFees.hostType === 'fixed') {
                            convertHostFee = hostServiceFee;
                        }

                        if (listingData.basePrice > 0) {
                            convertedAmount = convert(base.symbol, rates, listingData.basePrice, listingData.currency, convertCurrency);
                        }

                        if (listingData.currency != convertCurrency) {
                            console.log('not equal currency');
                            if (priceForDays > 0) {
                                convertedPriceForDays = convert(base.symbol, rates, priceForDays, listingData.currency, convertCurrency);
                            }

                            if (monthlyDiscountPercentage > 0) {
                                convertedMonthlyDiscountPercentage = convert(base.symbol, rates, monthlyDiscountPercentage, listingData.currency, convertCurrency);
                            }

                            if (weeklyDiscountPercentage > 0) {
                                convertedWeeklyDiscountPercentage = convert(base.symbol, rates, weeklyDiscountPercentage, listingData.currency, convertCurrency);
                            }

                            if (guestServiceFee > 0  && serviceFees.guestType === 'percentage') {
                                convertGuestServiceFee = convert(base.symbol, rates, guestServiceFee, listingData.currency, convertCurrency);
                            }
                            if (guestServiceFee > 0  && serviceFees.guestType === 'fixed') {
                                convertGuestServiceFee = guestServiceFee;
                            }

                            if (listingData.cleaningPrice > 0) {
                                convertCleaningPrice = convert(base.symbol, rates, listingData.cleaningPrice, listingData.currency, convertCurrency);
                            }

                            if (discount > 0) {
                                convertDiscount = convert(base.symbol, rates, discount, listingData.currency, convertCurrency);
                            }

                            if (hostServiceFee > 0 && serviceFees.hostType === 'percentage') {
                                convertHostFee = convert(base.symbol, rates, hostServiceFee, listingData.currency, convertCurrency);
                            }
                            if (hostServiceFee > 0 && serviceFees.hostType === 'fixed') {
                                convertHostFee = hostServiceFee;
                            }

                            if (listingData.basePrice > 0) {
                                convertedAmount = convert(base.symbol, rates, listingData.basePrice, listingData.currency, convertCurrency);
                            }
                        } else {
                            convertedPriceForDays = priceForDays;
                            convertedMonthlyDiscountPercentage = monthlyDiscountPercentage;
                            convertedWeeklyDiscountPercentage = weeklyDiscountPercentage
                            convertGuestServiceFee = guestServiceFee;
                            convertCleaningPrice = listingData.cleaningPrice > 0 ? listingData.cleaningPrice : 0
                            convertDiscount = discount;
                            convertHostFee = hostServiceFee;
                            convertedAmount = listingData.basePrice
                        }

                        total = (convertedPriceForDays + convertGuestServiceFee + convertCleaningPrice) - convertDiscount;
                        subtotal = (convertedPriceForDays + convertCleaningPrice) - convertDiscount;
                    } // listing data
                    return {
                        result: {
                            checkIn: moment(moment(startDate)).format('YYYY-MM-DD'),
                            checkOut: moment(moment(endDate)).format('YYYY-MM-DD'),
                            nights: dayDifference,
                            basePrice: convertedAmount.toFixed(2),
                            cleaningPrice: convertCleaningPrice.toFixed(2),
                            guests: guests > 0 ? guests : guestErrorMessage,
                            currency: convertCurrency,
                            guestServiceFeePercentage: serviceFees.guestValue,
                            hostServiceFeePercentage: serviceFees.hostValue,
                            weeklyDiscountPercentage: convertedWeeklyDiscountPercentage,
                            monthlyDiscountPercentage: convertedMonthlyDiscountPercentage,
                            guestServiceFee: convertGuestServiceFee.toFixed(2),
                            hostServiceFee: convertHostFee.toFixed(2),
                            discountLabel: discountType,
                            discount: convertDiscount.toFixed(2),
                            subtotal: subtotal.toFixed(2),
                            total: total.toFixed(2),
                            availableStatus: "Available"
                        },
                        status: 200
                    };

                }
            }
        } catch (error) {
            return {
                errorMessage: 'Something went wrong! ' + error,
                status: 400
            }
        }
    },
};

export default getBillingCalculation;

/*

query getBillingCalculation($listId: Int!, $startDate: String!, $endDate: String!, $guests: Int!, $convertCurrency: String!) {
  getBillingCalculation(listId: $listId, startDate: $startDate, endDate: $endDate, guests: $guests, convertCurrency: $convertCurrency) {
    status
    checkIn
    checkOut
    nights
    basePrice
    cleaningPrice
    guests
    currency
    guestServiceFeePercentage
    hostServiceFeePercentage
    weeklyDiscountPercentage
    monthlyDiscountPercentage
    guestServiceFee
    hostServiceFee
    discountLabel
    discount
    subtotal
    total
  }
}


*/