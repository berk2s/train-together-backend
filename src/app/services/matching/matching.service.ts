/**
 * @module app.services.interaction
 */

import { DocumentExists } from '@app/exceptions/document-exists-error'
import { DocumentNotFound } from '@app/exceptions/document-not-found-error'
import { MatchingMapper } from '@app/mappers/matching.mapper'
import { Matching, MatchingModel } from '@app/model/matching/Matching'
import { MatchingResponse } from '@app/types/response.types'
import { loggers } from 'winston'
import loggerService from '../logger/logger-service'

/**
 * Matching service
 * @class
 * @alias app.services.matching.MatchingService
 */
class MatchingService {
  private matching: MatchingModel

  constructor() {
    this.matching = Matching
  }

  public async match(
    interactedAthleteId: string,
    interactingAthleteId: string,
  ): Promise<MatchingResponse> {
    const alreadyMatched = await this.checkActiveMathces(
      interactedAthleteId,
      interactingAthleteId,
    )

    if (alreadyMatched) {
      loggerService.warn(
        `Athletes are already matched [interactedAthleteId: ${interactedAthleteId}, interactingAthleteId: ${interactingAthleteId}]`,
      )
      throw new DocumentExists('matching.exists')
    }

    const matching = new Matching({
      interactedUser: interactedAthleteId,
      interactingUser: interactingAthleteId,
      status: 'ACTIVE',
    })
    await matching.save()

    loggerService.info(
      `Athletes are succesfully matched [interactedAthleteId: ${interactedAthleteId}, interactingAthleteId: ${interactingAthleteId}]`,
    )

    return Promise.resolve(MatchingMapper.matchingToDTO(matching))
  }

  public async unlink(
    userId: string,
    matchingId: string,
  ): Promise<MatchingResponse> {
    const matching = await this.matching.findOne({
      $or: [
        {
          interactedUser: userId,
        },
        {
          interactingUser: userId,
        },
      ],
      $and: [
        {
          _id: matchingId,
        },
      ],
    })

    if (!matching) {
      loggerService.warn(
        `Matching with given ID doesn't exists [matchingId: ${matchingId}]`,
      )
      throw new DocumentNotFound('matching.notFound')
    }

    matching.status = 'CLOSED'
    await matching.save()

    loggerService.info(
      `The Athlete unlinked the matching [athleteId: ${userId}, matchingId: ${matchingId}]`,
    )

    return Promise.resolve(MatchingMapper.matchingToDTO(matching))
  }

  private async checkActiveMathces(
    firstUserId: string,
    secondUserId: string,
  ): Promise<boolean> {
    const matching = await this.matching.findOne({
      $or: [
        {
          interactedUser: firstUserId,
          interactigAthleteId: secondUserId,
        },
        {
          interactedUser: secondUserId,
          interactigAthleteId: firstUserId,
        },
      ],
      $and: [
        {
          status: 'ACTIVE',
        },
      ],
    })

    if (!matching) return Promise.resolve(false)

    return Promise.resolve(true)
  }
}

export default new MatchingService()