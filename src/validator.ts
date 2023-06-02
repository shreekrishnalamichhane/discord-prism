import { z } from 'zod'
import { TUpload } from './@types/types.js'

const validateUploadSchema = z.object({
  webhook: z
    .string({
      errorMap: () => {
        return { message: 'Webhook should be url' }
      },
    })
    .nonempty({
      message: 'Webhook is required',
    }),
  all: z
    .boolean({
      errorMap: () => {
        return { message: 'Option [--all | -a] should be either true or false.' }
      },
    })
    .optional(),
})
export function ValidateUpload(data: TUpload) {
  validateUploadSchema.parse(data)
}
