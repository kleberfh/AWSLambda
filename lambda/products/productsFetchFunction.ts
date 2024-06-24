import { DynamoDB } from 'aws-sdk';
import * as AWSXRay from "aws-xray-sdk";
import { ProductRepository } from '/opt/nodejs/productsLayer';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

AWSXRay.captureAWS(require('aws-sdk'))

const productsDdb = process.env.PRODUCTS_DDB!
const ddbClient = new DynamoDB.DocumentClient()

const productRepository = new ProductRepository(ddbClient, productsDdb)

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {

  const method = event.httpMethod

  if (event.resource === '/products') {
    if (method === 'GET') {
      const products = await productRepository.getAllProduct()

      return {
        statusCode: 200,
        body: JSON.stringify(products),
      }
    }
  } else if (event.resource === '/products/{id}') {
    const productId = event.pathParameters!.id as string

    try {
      const product = await productRepository.getProductById(productId)

      return {
        statusCode: 200,
        body: JSON.stringify(product),
      }
    } catch (e) {
      console.error((<Error>e).message)

      return {
        statusCode: 404,
        body: (<Error>e).message,
      }
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: 'Bad request',
    }),
  }
}
