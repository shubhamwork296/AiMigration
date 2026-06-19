export class ClubAvantiMemberShipDetailsRequestDto{
    customerKey: string;
}

export class ClubAvantiMemberShipDetailsResponseDto{
    CustomerAccountId: number;
    IsRegisteredToLoyality: boolean;
    IsRegistrationInProgress: boolean;
    CustomerKey: number;
    MembershipStartDate: string;
    MembershipEndDate: string;
    TierExpirationDate: string;
    LoyaltyTier: string;
    MembershipId: string;
    MembershipYear: number
    TripsCompleted: number;
    LastUpdated: string;
    EnrolledForLoyality: boolean;
    EnrolmentFailureMessage: string;
    CustomerEmailId: string;
    CustomerMobileNo: string;
    MyReward: ClubAvantiRewardDetailResponseDto;
    IsMembershipBenefitsReset: boolean;
    IsRegistrationError: boolean;
}

export class RegisterToClubAvantiRequestDto{
    CustomerKey: string;
    FirstName: string;
}

export class ClubAvantiRewardDetailRequestDto{
    CustomerAccountId: string;
}

export class ClubAvantiRewardDetailResponseDto{
    RewardsList: RewardList[];
    RewardCount: number;
}

export class RewardList{
    CustomerAccountId: string;
    CodeType: string;
    Code: string;
    RewardStartDate: string;
    RewardExpiryDate: string;
    RewardRedeemedDate: string;
    RewardCodeStatus: string;
    RewardCategoryCode: string;
    RewardSubCategoryCode: string;
    RewardCategoryCodeDescription: string;
    LastUpdated: string;
}
export class ClubAvantiJourneylistResponseDto{
    JourneyList: JourneyList[];
}

export class JourneyList {
    CustomerAccountId: number;
    FromStationName: string;
    ToStationName: string;
    DepartureTime: string;
    BookingRefrenceNumber: string;
    TripsCompleted: number;
    LastUpdated: string;
}