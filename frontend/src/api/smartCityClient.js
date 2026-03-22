export async function simulateCity(layoutData) {
    const response = await fetch("http://localhost:5001/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layoutData)
    });
    if (!response.ok) throw new Error("API error");
    return response.json();
}