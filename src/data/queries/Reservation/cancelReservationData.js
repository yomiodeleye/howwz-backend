import {
    Reservation,
    Listing,
    ListingData,
    Cancellation,
    Threads,
    UserProfile,
    User,
    CurrencyRates,
    Currencies,
    ReservationSpecialPricing,
    ServiceFees
} from '../../models';
import moment from 'moment';
import CancellationResponseType from '../../types/CancellationResponseType';
import { convert } from '../../../helpers/currencyConvertion';

import {
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
} from 'graphql';

const cancelReservationData = {

    type: CancellationResponseType,

    args: {
        reservationId: { type: new NonNull(IntType) },
        userType: { type: new NonNull(StringType) },
        currency: { type: StringType },
    },

    async resolve({ request }, { reservationId, currency, userType }) {

        try {

            if (request.user) {
                const id = reservationId;
                const userId = request.user.id;
                let where, cancellationData, listId, listData, listingData, policyData, threadData;
                let reservationState = [{ reservationState: 'pending' }, { reservationState: 'approved' }];
                let checkOut = { $gte: new Date() };
                let momentStartDate, momentEndDate, nights, interval, guestEmail;
                let today = moment().startOf('day');
                let accomodation, guestFees, remainingNights, policyName, firstName, hostEmail, convertedEarnedAmount = 0, nonRefundableNights = 0, guestServiceFee = 0;
                let checkInDate, checkOutDate, threadId, hostData, guestData, hostName, startedIn, convertedRefundNoGuestFee = 0;
                let refundableNightPrice = 0, nonRefundableNightPrice = 0, refundWithoutGuestFee = 0, convertPayoutToHost = 0;
                let updatedGuestFee = 0, updatedHostFee = 0, payoutToHost = 0, subtotal = 0, guestName, convertedGuestFee = 0;
                let refundAmount = 0, refundAmountNoGuestFee = 0, refundDays = 0, earnedAmount = 0, earnedDays = 0;
                let convertedRefundAmount = 0, rates, ratesData = {}, convertHostFee = 0, convertedNonRefundAmount = 0;
                let isSameCurrency = true, convertedSubTotal = 0, isSpecialPriceAssigned = false, convertedSpecialPriceAverage = 0;
                let priceForDays = 0, convertedResponse = [], basePrice = 0;



                const data = await CurrencyRates.findAll();
                const base = await Currencies.findOne({ where: { isBaseCurrency: true } });
                if (data) {
                    data.map((item) => {
                        ratesData[item.dataValues.currencyCode] = item.dataValues.rate;
                    })
                }
                rates = ratesData;

                if (userType === 'host') {
                    where = {
                        id,
                        hostId: userId,
                        $or: reservationState,
                        checkOut
                    };
                } else {
                    where = {
                        id,
                        guestId: userId,
                        $or: reservationState,
                        checkOut
                    };
                }

                cancellationData = await Reservation.findOne({
                    where,
                    attributes: ['id', 'listId', 'basePrice', 'cleaningPrice', 'currency', 'discount', 'guestServiceFee', 'hostServiceFee', 'total', 'confirmationCode', 'cancellationPolicy', 'isSpecialPriceAverage', 'hostServiceFeeType', 'hostServiceFeeValue', 'hostId', 'guestId', 'checkIn', 'checkOut', 'guests'],
                    raw: true
                });

                let cleaningPrice = 0
                if (cancellationData && cancellationData.cleaningPrice) {
                    cleaningPrice = cancellationData.cleaningPrice;
                } else {
                    cleaningPrice = 0;
                }



                const listingSpecialPricingData = await ReservationSpecialPricing.findAll({
                    where: {
                        reservationId: id
                    },
                    attributes: ['blockedDates', 'isSpecialPrice'],
                    order: [['blockedDates', 'ASC']],
                    raw: true
                });

                const serviceFees = await ServiceFees.findOne();

                let bookingSpecialPricing = [];
                if (listingSpecialPricingData && listingSpecialPricingData.length > 0) {
                    Promise.all(listingSpecialPricingData.map((item) => {

                        let pricingRow = {}, currentPrice;
                        if (item.blockedDates) {
                            isSpecialPriceAssigned = true;
                            currentPrice = Number(item.isSpecialPrice);
                        } else {
                            currentPrice = Number(cancellationData.basePrice);
                        }
                        pricingRow = {
                            blockedDates: item.blockedDates,
                            isSpecialPrice: currentPrice,
                        };
                        bookingSpecialPricing.push(pricingRow);
                    }));

                } else {
                    bookingSpecialPricing = [];
                }

                if (cancellationData) {
                    listId = cancellationData.listId

                    if (cancellationData.checkIn != null && cancellationData.checkOut != null) {
                        momentStartDate = moment(cancellationData.checkIn).startOf('day');
                        momentEndDate = moment(cancellationData.checkOut).startOf('day');
                        nights = momentEndDate.diff(momentStartDate, 'days');
                        interval = momentStartDate.diff(today, 'days');
                        checkInDate = cancellationData.checkIn != null ? moment(cancellationData.checkIn).format('Do MMM') : '';
                        checkOutDate = cancellationData.checkOut != null ? moment(cancellationData.checkOut).format('Do MMM') : '';
                    }


                    hostEmail = await User.findOne({
                        attributes: ['email'],
                        where: {
                            id: cancellationData.hostId
                        },
                        raw: true
                    });

                    guestEmail = await User.findOne({
                        attributes: ['email'],
                        where: {
                            id: cancellationData.guestId
                        },
                        raw: true
                    });

                    threadData = await Threads.findOne({
                        attributes: ['id'],
                        where: {
                            listId,
                            $or: [
                                {
                                    host: cancellationData.guestId
                                },
                                {
                                    guest: cancellationData.guestId
                                }
                            ]
                        },
                        raw: true
                    });

                    hostData = await UserProfile.findOne({
                        attributes: ['firstName', 'picture'],
                        where: {
                            userId: cancellationData.hostId
                        },
                        raw: true
                    });

                    guestData = await UserProfile.findOne({
                        attributes: ['firstName', 'picture'],
                        where: {
                            userId: cancellationData.guestId
                        },
                        raw: true
                    });

                } else {
                    return {
                        status: 400,
                        errorMessage: "Something went wrong!."

                    }
                }

                if (listId) {

                    listData = await Listing.findOne({
                        where: {
                            id: listId
                        },
                        attributes: ['id', 'title'],
                        raw: true
                    });

                    listingData = await ListingData.findOne({
                        attributes: ['listId'],
                        where: {
                            listId
                        },
                        raw: true
                    });
                }


                if (listingData) {
                    policyData = await Cancellation.findOne({
                        where: {
                            id: cancellationData.cancellationPolicy
                        },
                        raw: true
                    });
                }


                if (threadData) {
                    threadId = threadData.id
                }

                if (hostData) {
                    hostName = hostData.firstName
                }
                if (guestData) {
                    guestName = guestData.firstName
                }

                if (isSpecialPriceAssigned) {
                    bookingSpecialPricing.map((item, index) => {
                        priceForDays = Number(priceForDays) + Number(item.isSpecialPrice);
                    });
                } else {
                    priceForDays = Number(cancellationData.basePrice) * Number(nights)
                }

                basePrice = cancellationData.isSpecialPriceAverage ? cancellationData.isSpecialPriceAverage : cancellationData.basePrice;

                if (remainingNights > 0) {
                    startedIn = nights - remainingNights;
                } else {
                    startedIn = interval;
                }

                if (listData && listingData && policyData) {
                    policyName = policyData.policyName;
                    if (interval >= policyData.priorDays) {
                        // Prior
                        accomodation = policyData.accommodationPriorCheckIn;
                        guestFees = policyData.guestFeePriorCheckIn;
                        nonRefundableNights = policyData.nonRefundableNightsPriorCheckIn
                    } else if (interval < policyData.priorDays && interval > 0) {

                        // Before
                        accomodation = policyData.accommodationBeforeCheckIn;
                        guestFees = policyData.guestFeeBeforeCheckIn;
                        nonRefundableNights = policyData.nonRefundableNightsBeforeCheckIn;
                    } else if (interval < policyData.priorDays && interval <= 0) {
                        // During
                        accomodation = policyData.accommodationDuringCheckIn;
                        guestFees = policyData.guestFeeDuringCheckIn;
                        nonRefundableNights = policyData.nonRefundableNightsDuringCheckIn;
                        remainingNights = interval === 0 ? nights - policyData.nonRefundableNightsBeforeCheckIn : nights + interval;  
                    }
                }

                let checkInNights = (remainingNights == 0 || remainingNights > 0) ? remainingNights : nights;
                let totalNights = checkInNights - nonRefundableNights;

                if (cancellationData) {
                    if (userType === 'guest') {
                        // Details for guest
                        firstName = hostData.firstName;
                        let refundHostServiceFee = 0, hostRefund = 0;
                        if (accomodation == 0) {
                            cleaningPrice = 0;
                            guestServiceFee = 0;
                        } else {
                            cleaningPrice = cleaningPrice;
                            guestServiceFee = cancellationData.guestServiceFee;
                        }
                        
                        if (remainingNights == 0 || remainingNights > 0) {
                            if (remainingNights == nights) {
                                refundableNightPrice = ((totalNights * basePrice) * (accomodation / 100)) + cleaningPrice + (guestServiceFee * (guestFees / 100)) - cancellationData.discount;
                                refundWithoutGuestFee = ((totalNights * basePrice) * (accomodation / 100)) - refundableNightPrice;
                                nonRefundableNightPrice = (cancellationData.total + guestServiceFee) - refundableNightPrice;
                                hostRefund = (cancellationData.total + guestServiceFee) - refundableNightPrice;
                                updatedGuestFee = guestServiceFee;
                                if (cancellationData.hostServiceFeeType === 'percentage') {
                                    refundHostServiceFee = hostRefund * (Number(cancellationData.hostServiceFeeValue) / 100);
                                } else {
                                    refundHostServiceFee = convert(base, rates, cancellationData.hostServiceFeeValue, serviceFees.currency, currency);
                                }
                                payoutToHost = hostRefund - refundHostServiceFee;
                                updatedHostFee = cancellationData.hostServiceFee;
                            } else {
                                refundableNightPrice = ((totalNights * basePrice) * (accomodation / 100)) - cancellationData.discount;
                                refundWithoutGuestFee = ((totalNights * basePrice) * (accomodation / 100));
                                nonRefundableNightPrice = (cancellationData.total + guestServiceFee) - refundableNightPrice;
                                updatedGuestFee = guestServiceFee;
                                hostRefund = cancellationData.total - refundableNightPrice;

                                if (cancellationData.hostServiceFeeType === 'percentage') {
                                    refundHostServiceFee = hostRefund * (Number(cancellationData.hostServiceFeeValue) / 100);
                                } else {
                                    refundHostServiceFee = convert(base, rates, cancellationData.hostServiceFeeValue, serviceFees.currency, currency);
                                }
                                payoutToHost = hostRefund - refundHostServiceFee;
                                updatedHostFee = cancellationData.hostServiceFee;
                            }

                        } else {
                            
                            if (cancellationData) {
                                refundableNightPrice = ((totalNights * basePrice) * (accomodation / 100)) + cleaningPrice + (guestServiceFee * (guestFees / 100)) - cancellationData.discount;
                                refundWithoutGuestFee = ((totalNights * basePrice) * (accomodation / 100)) + cleaningPrice;
                            }
                            if (refundWithoutGuestFee != cancellationData.total) {
                                nonRefundableNightPrice = cancellationData.total - refundWithoutGuestFee;
                                hostRefund = (cancellationData.total + guestServiceFee) - refundableNightPrice;

                                if (cancellationData.hostServiceFeeType === 'percentage') {
                                    refundHostServiceFee = hostRefund * (Number(cancellationData.hostServiceFeeValue) / 100);
                                } else {
                                    refundHostServiceFee = convert(base, rates, cancellationData.hostServiceFeeValue, serviceFees.currency, currency);
                                }
                                payoutToHost = hostRefund - refundHostServiceFee;
                                updatedHostFee = cancellationData.hostServiceFee;
                                updatedGuestFee = guestServiceFee;
                            }   
                        }
                        subtotal = cancellationData.total + guestServiceFee;

                        if (currency != cancellationData.currency) {
                            isSameCurrency = false;
                            if (updatedHostFee > 0) {
                                convertHostFee = convert(base.symbol, rates, updatedHostFee, cancellationData.currency, currency);
                            }
                            if (refundableNightPrice > 0) {
                                convertedRefundAmount = convert(base.symbol, rates, refundableNightPrice, cancellationData.currency, currency);
                            }
                            if (nonRefundableNightPrice > 0) {
                                convertedNonRefundAmount = convert(base.symbol, rates, nonRefundableNightPrice, cancellationData.currency, currency);
                            }
                            if (updatedGuestFee > 0) {
                                convertedGuestFee = convert(base.symbol, rates, updatedGuestFee, cancellationData.currency, currency);
                            }
                            if (payoutToHost > 0) {
                                convertPayoutToHost = convert(base.symbol, rates, payoutToHost, cancellationData.currency, currency);
                            }
                            if (subtotal > 0) {
                                convertedSubTotal = convert(base.symbol, rates, subtotal, cancellationData.currency, currency);
                            }

                            if (cancellationData && cancellationData.isSpecialPriceAverage > 0) {
                                convertedSpecialPriceAverage = convert(base.symbol, rates, cancellationData.isSpecialPriceAverage, cancellationData.currency, currency);
                            }
                        }


                        return {
                            results: {
                                reservationId: reservationId,
                                cancellationPolicy: policyName,
                                refundToGuest: isSameCurrency ? refundableNightPrice : convertedRefundAmount.toFixed(2),
                                nonRefundableNightPrice: isSameCurrency ? nonRefundableNightPrice : convertedNonRefundAmount.toFixed(2),
                                payoutToHost: isSameCurrency ? payoutToHost : convertPayoutToHost.toFixed(2),
                                guestServiceFee: isSameCurrency ? updatedGuestFee : convertedGuestFee.toFixed(2),
                                hostServiceFee: isSameCurrency ? updatedHostFee : convertHostFee.toFixed(2),
                                startedIn: startedIn,
                                stayingFor: nights,
                                total: isSameCurrency ? subtotal : convertedSubTotal.toFixed(2),
                                listId,
                                currency,
                                threadId,
                                cancelledBy: 'guest',
                                checkIn: moment(moment(cancellationData.checkIn)).format('YYYY-MM-DD'),
                                checkOut: moment(moment(cancellationData.checkOut)).format('YYYY-MM-DD'),
                                guests: cancellationData.guests,
                                guestName,
                                hostName: firstName,
                                listTitle: listData.title,
                                confirmationCode: cancellationData.confirmationCode,
                                hostEmail: hostEmail.email,
                                hostProfilePicture: hostData.picture,
                                guestProfilePicture: guestData.picture,
                                isSpecialPriceAverage: isSameCurrency ? cancellationData.isSpecialPriceAverage : convertedSpecialPriceAverage.toFixed(2),
                            },
                            status: 200
                        }
                    } else {
                        firstName = guestData.firstName;
                        if (accomodation == 0) {
                            cleaningPrice = 0;
                            guestServiceFee = 0;
                        } else {
                            cleaningPrice = cleaningPrice;
                            guestServiceFee = cancellationData.guestServiceFee;
                        }

                        refundAmount = (nights * basePrice) + cleaningPrice + (guestServiceFee * (guestFees / 100));
                        refundAmountNoGuestFee = (nights * basePrice) + cleaningPrice - cancellationData.hostServiceFee;
                        earnedAmount = 0;
                        earnedDays = 0;
                        refundDays = nights;
                        subtotal = cancellationData.total + guestServiceFee;

                        if (currency != cancellationData.currency) {
                            isSameCurrency = false;
                            if (refundAmount > 0) {
                                convertedRefundAmount = convert(base.symbol, rates, refundAmount, cancellationData.currency, currency);
                            }

                            convertedRefundNoGuestFee = convert(base.symbol, rates, refundAmountNoGuestFee, cancellationData.currency, currency);
                            
                            if (earnedAmount > 0) {
                                convertedEarnedAmount = convert(base.symbol, rates, earnedAmount, cancellationData.currency, currency);
                            }
                            if (cancellationData.hostServiceFee > 0) {
                                convertHostFee = convert(base.symbol, rates, cancellationData.hostServiceFee, cancellationData.currency, currency);
                            }
                            if (subtotal > 0) {
                                convertedSubTotal = convert(base.symbol, rates, subtotal, cancellationData.currency, currency);
                            }

                            if (cancellationData && cancellationData.isSpecialPriceAverage > 0) {
                                convertedSpecialPriceAverage = convert(base.symbol, rates, cancellationData.isSpecialPriceAverage, cancellationData.currency, currency);
                            }
                        }
                        return {
                            results: {
                                reservationId: reservationId,
                                cancellationPolicy: policyName,
                                refundToGuest: isSameCurrency ? refundAmount : convertedRefundAmount.toFixed(2),
                                payoutToHost: isSameCurrency ? earnedAmount : convertedEarnedAmount.toFixed(2),
                                nonRefundableNightPrice: isSameCurrency ? refundAmountNoGuestFee : convertedRefundNoGuestFee.toFixed(2),
                                guestServiceFee: 0,
                                hostServiceFee: isSameCurrency ? cancellationData.hostServiceFee : convertHostFee.toFixed(2),
                                startedIn: startedIn,
                                stayingFor: nights,
                                total: isSameCurrency ? subtotal : convertedSubTotal.toFixed(2),
                                listId,
                                currency,
                                threadId,
                                cancelledBy: 'host',
                                checkIn: moment(moment(cancellationData.checkIn)).format('YYYY-MM-DD'),
                                checkOut: moment(moment(cancellationData.checkOut)).format('YYYY-MM-DD'),
                                guests: cancellationData.guests,
                                hostName,
                                guestName: firstName,
                                listTitle: listData.title,
                                confirmationCode: cancellationData.confirmationCode,
                                guestEmail: guestEmail.email,
                                guestProfilePicture: guestData.picture,
                                hostProfilePicture: hostData.picture,
                                isSpecialPriceAverage: isSameCurrency ? cancellationData.isSpecialPriceAverage : convertedSpecialPriceAverage.toFixed(2),
                            },
                            status: 200
                        }
                    }
                }

            } else {
                return {
                    status: 500,
                    errorMessage: 'You are not loggedin',
                };
            }

        } catch (error) {
            return {
                errorMessage: 'Something went wrong! ' + error,
                status: 400
            }
        }

    }
};

export default cancelReservationData;
