import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Call remove.bg API
    const apiKey = process.env.REMOVE_BG_API_KEY
    
    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json(
        { error: 'REMOVE_BG_API_KEY not configured' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: new URLSearchParams({
        image_file_b64: buffer.toString('base64'),
        size: 'auto',
        format: 'png',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('remove.bg API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to remove background' },
        { status: response.status }
      )
    }

    // Return the image directly
    const resultBuffer = await response.arrayBuffer()
    
    return new NextResponse(resultBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="no-bg.png"',
      },
    })
  } catch (error) {
    console.error('Error processing image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
