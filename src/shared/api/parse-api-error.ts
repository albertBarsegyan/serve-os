import { HTTPError } from 'ky'

export async function getApiErrorMessage(error: unknown): Promise<string> {
	if (error instanceof HTTPError) {
		try {
			const data = (await error.response.json()) as {
				message?: string | string[]
			}
			if (Array.isArray(data.message)) {
				return data.message.join(', ')
			}
			if (data.message) {
				return data.message
			}
		} catch {
			// ignore
		}
		return error.message
	}
	if (error instanceof Error) {
		return error.message
	}
	return 'Request failed'
}
