declare module 'class-validator' {
  export interface ValidationOptions {
    each?: boolean;
    message?: string | ((validationArguments: any) => string);
    groups?: string[];
    always?: boolean;
    context?: any;
  }

  export interface IsNumberOptions {
    allowNaN?: boolean;
    allowInfinity?: boolean;
    maxDecimalPlaces?: number;
  }

  export function IsString(validationOptions?: ValidationOptions): PropertyDecorator;
  export function IsNotEmpty(validationOptions?: ValidationOptions): PropertyDecorator;
  export function IsOptional(validationOptions?: ValidationOptions): PropertyDecorator;
  export function IsEmail(options?: any, validationOptions?: ValidationOptions): PropertyDecorator;
  export function IsArray(validationOptions?: ValidationOptions): PropertyDecorator;
  export function IsNumber(
    options?: IsNumberOptions,
    validationOptions?: ValidationOptions,
  ): PropertyDecorator;
  export function IsInt(validationOptions?: ValidationOptions): PropertyDecorator;
  export function IsIn(
    values: readonly any[],
    validationOptions?: ValidationOptions,
  ): PropertyDecorator;
  export function Min(min: number, validationOptions?: ValidationOptions): PropertyDecorator;
  export function Max(max: number, validationOptions?: ValidationOptions): PropertyDecorator;
  export function MinLength(min: number, validationOptions?: ValidationOptions): PropertyDecorator;
  export function MaxLength(max: number, validationOptions?: ValidationOptions): PropertyDecorator;
  export function ValidateIf(
    condition: (object: any, value: any) => boolean,
    validationOptions?: ValidationOptions,
  ): PropertyDecorator;

  export interface ValidationError {
    target?: object;
    property: string;
    value?: any;
    constraints?: { [type: string]: string };
    children?: ValidationError[];
    contexts?: { [type: string]: any };
  }

  export interface ValidatorOptions {
    skipMissingProperties?: boolean;
    whitelist?: boolean;
    forbidNonWhitelisted?: boolean;
    groups?: string[];
    dismissDefaultMessages?: boolean;
    validationError?: {
      target?: boolean;
      value?: boolean;
    };
    forbidUnknownValues?: boolean;
    stopAtFirstError?: boolean;
  }

  export function validate(
    object: object,
    validatorOptions?: ValidatorOptions,
  ): Promise<ValidationError[]>;
}
