'use client'

export const ParseCTA = () => {
    return (
        <div className="w-full h-screen">
            <button className="  mt-20" onClick={() => {
                fetch(`/api/file`, {
                    method: "POST",
                })
            }}>
                Parse PDF
            </button>
        </div>
    )
}