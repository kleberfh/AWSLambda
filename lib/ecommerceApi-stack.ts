import * as cdk from 'aws-cdk-lib'
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as apiGateway from 'aws-cdk-lib/aws-apigateway'
import * as cwLogs from 'aws-cdk-lib/aws-logs'
import { Construct  } from 'constructs'

interface ECommerceApiStackProps extends cdk.StackProps {
  productsFetchHandler: lambdaNodeJs.NodejsFunction
  productsAdminHandler: lambdaNodeJs.NodejsFunction
  ordersHandler: lambdaNodeJs.NodejsFunction
}

export class EcommerceApiStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: ECommerceApiStackProps) {
    super(scope, id, props);

    const logGroup = new cwLogs.LogGroup(this, 'EcommerceApiLogs', {
      logGroupName: '/aws/lambda/EcommerceApi',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    const api = new apiGateway.RestApi(this, 'EcommerceApi', {
      restApiName: 'EcommerceApi',
      cloudWatchRole: true,
      deployOptions: {
        accessLogDestination: new apiGateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apiGateway.AccessLogFormat.jsonWithStandardFields({
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          caller: true,
          user: true,
        }),
      }
    })

    this.createProductsService(props, api)
    this.createOrdersService(props, api)
  }

  private createOrdersService(props: ECommerceApiStackProps, api: apiGateway.RestApi) {
    const ordersIntegration = new apiGateway.LambdaIntegration(props.ordersHandler)

    // resource - /orders
    const ordersResource = api.root.addResource('orders')

    // GET /orders
    // GET /orders?email=email
    // GET /orders?email=email&orderId=123
    ordersResource.addMethod('GET', ordersIntegration)

    const orderDeletionValidator = new apiGateway.RequestValidator(this, 'OrderDeletionValidator', {
      restApi: api,
      requestValidatorName: 'OrderDeletionValidator',
      validateRequestParameters: true,
    })
    // DELETE /orders?email=email&orderId=123
    ordersResource.addMethod('DELETE', ordersIntegration, {
      requestParameters: {
        'method.request.querystring.email': true,
        'method.request.querystring.orderId': true,
      },
      requestValidator: orderDeletionValidator
    })

    // POST /orders
    ordersResource.addMethod('POST', ordersIntegration)
  }

  private createProductsService(props: ECommerceApiStackProps, api: apiGateway.RestApi) {
    const productsFetchIntegration = new apiGateway.LambdaIntegration(props.productsFetchHandler)

    // GET "/products"
    const productsResource = api.root.addResource('products')
    productsResource.addMethod('GET', productsFetchIntegration)

    // GET "/products/{id}
    const productIdResource = productsResource.addResource('{id}')
    productIdResource.addMethod('GET', productsFetchIntegration)

    const productsAdminIntegration = new apiGateway.LambdaIntegration(props.productsAdminHandler)

    // POST "/products"
    productsResource.addMethod('POST', productsAdminIntegration)

    // PUT "/products/{id}"
    productIdResource.addMethod('PUT', productsAdminIntegration)

    // DELETE "/products/{id}"
    productIdResource.addMethod('DELETE', productsAdminIntegration)
  }
}
