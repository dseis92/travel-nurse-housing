import { supabase } from '../lib/supabaseClient'

export interface Review {
  id: string
  listingId: string
  bookingId: string
  reviewerId: string
  hostId: string
  rating: number
  cleanlinessRating?: number
  accuracyRating?: number
  communicationRating?: number
  locationRating?: number
  valueRating?: number
  title?: string
  comment: string
  pros?: string[]
  cons?: string[]
  wouldRecommend: boolean
  hostResponse?: string
  hostRespondedAt?: string
  helpfulCount: number
  createdAt: string
  updatedAt: string
  // From view
  reviewerName?: string
  reviewerAvatar?: string
  reviewerVerified?: string
  listingTitle?: string
  listingCity?: string
  listingState?: string
  hostName?: string
}

export interface CreateReviewInput {
  listingId: string
  bookingId: string
  hostId: string
  rating: number
  cleanlinessRating?: number
  accuracyRating?: number
  communicationRating?: number
  locationRating?: number
  valueRating?: number
  title?: string
  comment: string
  pros?: string[]
  cons?: string[]
  wouldRecommend?: boolean
}

export interface RatingBreakdown {
  overallRating: number
  reviewCount: number
  cleanlinessAvg?: number
  accuracyAvg?: number
  communicationAvg?: number
  locationAvg?: number
  valueAvg?: number
  fiveStarCount: number
  fourStarCount: number
  threeStarCount: number
  twoStarCount: number
  oneStarCount: number
  recommendPercentage?: number
}

export const reviewService = {
  /**
   * Get reviews for a listing
   */
  async getListingReviews(listingId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('review_details')
      .select('*')
      .eq('listing_id', listingId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (
      data?.map((review: any) => ({
        id: review.id,
        listingId: review.listing_id,
        bookingId: review.booking_id,
        reviewerId: review.reviewer_id,
        hostId: review.host_id,
        rating: review.rating,
        cleanlinessRating: review.cleanliness_rating,
        accuracyRating: review.accuracy_rating,
        communicationRating: review.communication_rating,
        locationRating: review.location_rating,
        valueRating: review.value_rating,
        title: review.title,
        comment: review.comment,
        pros: review.pros,
        cons: review.cons,
        wouldRecommend: review.would_recommend,
        hostResponse: review.host_response,
        hostRespondedAt: review.host_responded_at,
        helpfulCount: review.helpful_count,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        reviewerName: review.reviewer_name,
        reviewerAvatar: review.reviewer_avatar,
        reviewerVerified: review.reviewer_verified,
        listingTitle: review.listing_title,
        listingCity: review.listing_city,
        listingState: review.listing_state,
        hostName: review.host_name,
      })) || []
    )
  },

  /**
   * Get user's reviews
   */
  async getUserReviews(userId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('review_details')
      .select('*')
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (
      data?.map((review: any) => ({
        id: review.id,
        listingId: review.listing_id,
        bookingId: review.booking_id,
        reviewerId: review.reviewer_id,
        hostId: review.host_id,
        rating: review.rating,
        cleanlinessRating: review.cleanliness_rating,
        accuracyRating: review.accuracy_rating,
        communicationRating: review.communication_rating,
        locationRating: review.location_rating,
        valueRating: review.value_rating,
        title: review.title,
        comment: review.comment,
        pros: review.pros,
        cons: review.cons,
        wouldRecommend: review.would_recommend,
        hostResponse: review.host_response,
        hostRespondedAt: review.host_responded_at,
        helpfulCount: review.helpful_count,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        listingTitle: review.listing_title,
        listingCity: review.listing_city,
        listingState: review.listing_state,
      })) || []
    )
  },

  /**
   * Create a review
   */
  async createReview(review: CreateReviewInput): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        listing_id: review.listingId,
        booking_id: review.bookingId,
        host_id: review.hostId,
        rating: review.rating,
        cleanliness_rating: review.cleanlinessRating,
        accuracy_rating: review.accuracyRating,
        communication_rating: review.communicationRating,
        location_rating: review.locationRating,
        value_rating: review.valueRating,
        title: review.title,
        comment: review.comment,
        pros: review.pros,
        cons: review.cons,
        would_recommend: review.wouldRecommend ?? true,
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      listingId: data.listing_id,
      bookingId: data.booking_id,
      reviewerId: data.reviewer_id,
      hostId: data.host_id,
      rating: data.rating,
      cleanlinessRating: data.cleanliness_rating,
      accuracyRating: data.accuracy_rating,
      communicationRating: data.communication_rating,
      locationRating: data.location_rating,
      valueRating: data.value_rating,
      title: data.title,
      comment: data.comment,
      pros: data.pros,
      cons: data.cons,
      wouldRecommend: data.would_recommend,
      hostResponse: data.host_response,
      hostRespondedAt: data.host_responded_at,
      helpfulCount: data.helpful_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  /**
   * Add host response to a review
   */
  async addHostResponse(reviewId: string, response: string): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .update({
        host_response: response,
        host_responded_at: new Date().toISOString(),
      })
      .eq('id', reviewId)

    if (error) throw error
  },

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId: string): Promise<void> {
    const { error } = await supabase
      .from('review_helpful_votes')
      .insert({
        review_id: reviewId,
      })

    if (error) throw error
  },

  /**
   * Unmark review as helpful
   */
  async unmarkHelpful(reviewId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('review_helpful_votes')
      .delete()
      .eq('review_id', reviewId)
      .eq('user_id', userId)

    if (error) throw error
  },

  /**
   * Get rating breakdown for a listing
   */
  async getRatingBreakdown(listingId: string): Promise<RatingBreakdown | null> {
    const { data, error } = await supabase.rpc('get_listing_rating_breakdown', {
      p_listing_id: listingId,
    })

    if (error) throw error
    if (!data || data.length === 0) return null

    const breakdown = data[0]
    return {
      overallRating: breakdown.overall_rating || 0,
      reviewCount: breakdown.review_count || 0,
      cleanlinessAvg: breakdown.cleanliness_avg,
      accuracyAvg: breakdown.accuracy_avg,
      communicationAvg: breakdown.communication_avg,
      locationAvg: breakdown.location_avg,
      valueAvg: breakdown.value_avg,
      fiveStarCount: breakdown.five_star_count || 0,
      fourStarCount: breakdown.four_star_count || 0,
      threeStarCount: breakdown.three_star_count || 0,
      twoStarCount: breakdown.two_star_count || 0,
      oneStarCount: breakdown.one_star_count || 0,
      recommendPercentage: breakdown.recommend_percentage,
    }
  },

  /**
   * Check if user can review a booking
   */
  async canReviewBooking(
    bookingId: string,
    userId: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('can_user_review_booking', {
      p_booking_id: bookingId,
      p_user_id: userId,
    })

    if (error) throw error

    return data as boolean
  },
}
