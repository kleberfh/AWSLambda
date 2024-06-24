import * as AWSXRay from 'aws-xray-sdk';
import { DynamoDB, Lambda } from 'aws-sdk';
import {ProductEvent, ProductEventType} from "/opt/nodejs/productEventsLayer";
import {Product, ProductRepository} from '/opt/nodejs/productsLayer';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

AWSXRay.captureAWS(require('aws-sdk'))

const productsDdb = process.env.PRODUCTS_DDB!
const productEventsFunctionName = process.env.PRODUCTS_EVENTS_FUNCTION_NAME!

const ddbClient = new DynamoDB.DocumentClient()
const lambdaClient = new Lambda()

const productRepository = new ProductRepository(ddbClient, productsDdb)

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod

  if (event.resource === '/products') {
    const product = JSON.parse(event.body!) as Product

    const productCreated = await productRepository.create(product)

    await sendProductEvent(
      productCreated,
      ProductEventType.CREATED,
      'kleber@kleberfh.com',
      context.awsRequestId
    )

    return {
      statusCode: 201,
      body: JSON.stringify(productCreated),
    }
  } else if (event.resource === '/products/{id}') {
    const productId = event.pathParameters!.id as string
    if (method === 'PUT') {
      const product = JSON.parse(event.body!) as Product

      try {
        const productUpdated = await productRepository.updateProduct(productId, product)

        await sendProductEvent(
          productUpdated,
          ProductEventType.UPDATED,
          'kleber@kleberfh.com',
          context.awsRequestId
        )

        return {
          statusCode: 200,
          body: JSON.stringify(productUpdated)
        }
      } catch (ConditionalCheckFailedException) {
        return {
          statusCode: 404,
          body: 'Product not found',
        }
      }
    } else if (method === 'DELETE') {
      try {
        const productDeleted = await productRepository.deleteProduct(productId)

        await sendProductEvent(
          productDeleted,
          ProductEventType.DELETED,
          'kleber@kleberfh.com',
          context.awsRequestId
        )

        return {
          statusCode: 200,
          body: JSON.stringify(productDeleted),
        }
      } catch (e) {
        console.error((<Error>e).message)

        return {
          statusCode: 404,
          body: (<Error>e).message,
        }
      }
    }
  }

  return {
    statusCode: 400,
    body: 'Bad request',
  }
}

function sendProductEvent(
  product: Product,
  eventType: ProductEventType,
  email: string,
  lambdaRequestId: string
) {
  const event: ProductEvent = {
    email,
    eventType,
    productCode: product.code,
    productId: product.id,
    productPrice: product.price,
    requestId: lambdaRequestId,
  }

  return lambdaClient.invoke({
    FunctionName: productEventsFunctionName,
    Payload: JSON.stringify(event),
    InvocationType: 'Event',
  }).promise()
}
