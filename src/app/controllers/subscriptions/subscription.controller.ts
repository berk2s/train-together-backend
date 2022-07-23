/**
 * @module app.controller.subscription
 */

import stripeService from '@app/services/stripe/stripe.service'
import subscriptionService from '@app/services/subscription/subscription.service'
import { IncomingRequest } from '@app/types/controller.types'
import { NextFunction, Response } from 'express'
import {
  SubscribeRequest,
  UnsubscribeRequest,
  WebhookRequest,
} from './subscription-controller.types'

/**
 * Subscription Controller
 * @class
 * @alias app.controller.subscription.SubscriptionController
 */
class SubscriptionController {
  public readonly ENDPOINT: string = '/subscriptions'

  /**
   * Handles subscribe request
   */
  public async subscribe(
    req: IncomingRequest<SubscribeRequest>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { userId, userEmail } = req
      const { packageName: lookUpKey } = req.bodyDto

      const createdSession = await stripeService.createSession(
        userId,
        userEmail,
        lookUpKey,
      )

      res.status(200).json(createdSession)
    } catch (err) {
      next(err)
    }
  }

  /**
   * Handles webhook request that comes from Stripe
   */
  public async webhook(
    req: IncomingRequest<WebhookRequest>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const rawBody = req.rawBody
      const signature = req.headers['stripe-signature']

      await stripeService.webhook(rawBody, signature)

      res.send()
    } catch (err) {
      next(err)
    }
  }

  /**
   * Handles unsubscribe request
   */
  public async unsubscribe(
    req: IncomingRequest<UnsubscribeRequest>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { userId } = req
      const { packageName } = req.bodyDto

      const subscription = await subscriptionService.unsubscribe(
        userId,
        packageName,
      )

      res.status(200).send(subscription)
    } catch (err) {
      next(err)
    }
  }
}

export default new SubscriptionController()