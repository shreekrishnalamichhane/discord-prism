export type TFileinfo = {
  name: string
  extension: string
  size: number
  formattedSize: string
  type: string | null
  content: Buffer | ArrayBuffer
}
