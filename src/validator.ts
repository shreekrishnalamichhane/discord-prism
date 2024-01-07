import { z } from 'zod'

const validateUploadSchema = z.object({
  webhook: z.string({
    errorMap: () => {
      return { message: 'Webhook should be url' }
    },
  }),
  all: z
    .boolean({
      errorMap: () => {
        return { message: 'Option [--all | -a] should be either true or false.' }
      },
    })
    .optional(),
  skip: z
    .string({
      errorMap: () => {
        return { message: 'Option [--skip | -s] should be a number.' }
      },
    })
    .default('0')
    .transform(data => {
      const val: number = Number(data)
      if (isNaN(val)) throw new Error('Invalid value. Option [--skip | -s] should be a number.')
      if (!isNaN(val) && val < 0) return 0
      return val
    }),
})

export type TUpload = z.infer<typeof validateUploadSchema>

export function ValidateUpload(data: TUpload) {
  return validateUploadSchema.parse(data)
}
