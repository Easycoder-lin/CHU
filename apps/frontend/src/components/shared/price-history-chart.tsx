"use client"

import { createChart, ColorType, IChartApi, ISeriesApi, Time, AreaSeries } from "lightweight-charts"
import React, { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

interface ChartProps {
    data: { time: string; value: number }[]
    colors?: {
        backgroundColor?: string
        lineColor?: string
        textColor?: string
        areaTopColor?: string
        areaBottomColor?: string
    }
}

export function PriceHistoryChart({ data, colors }: ChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<"Area"> | null>(null)
    const { theme, systemTheme } = useTheme()

    // Determine current theme (light or dark)
    const currentTheme = theme === "system" ? systemTheme : theme
    const isDark = currentTheme === "dark"

    const backgroundColor = isDark ? "#0b0f1a" : "white"
    const lineColor = isDark ? "#6366f1" : "#4f46e5" // Indigo-500/600
    const textColor = isDark ? "#94a3b8" : "#64748b" // Slate-400/500
    const areaTopColor = isDark ? "rgba(99, 102, 241, 0.4)" : "rgba(79, 70, 229, 0.2)"
    const areaBottomColor = isDark ? "rgba(99, 102, 241, 0)" : "rgba(79, 70, 229, 0)"

    useEffect(() => {
        if (!chartContainerRef.current) return

        const handleResize = () => {
            chartRef.current?.applyOptions({ width: chartContainerRef.current!.clientWidth })
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor: textColor,
            },
            width: chartContainerRef.current.clientWidth,
            height: 300,
            grid: {
                vertLines: { visible: false },
                horzLines: { color: isDark ? "#1e293b" : "#f1f5f9" }, // Slate-800 / Slate-100
            },
            rightPriceScale: {
                borderVisible: false,
            },
            timeScale: {
                borderVisible: false,
            },
            crosshair: {
                vertLine: {
                    labelVisible: false,
                }
            }
        })

        chart.timeScale().fitContent()

        const newSeries = chart.addSeries(AreaSeries, {
            lineColor: lineColor,
            topColor: areaTopColor,
            bottomColor: areaBottomColor,
            lineWidth: 2,
        })

        // Cast data to expected type for library
        // @ts-ignore
        newSeries.setData(data)

        chartRef.current = chart
        seriesRef.current = newSeries

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
            chart.remove()
        }
    }, [backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]) // Re-create on theme change for simplicity

    // Update data separately if needed, but re-creation handles theme switch better
    useEffect(() => {
        if (seriesRef.current) {
            // @ts-ignore
            seriesRef.current.setData(data)
        }
    }, [data])


    return <div ref={chartContainerRef} className="w-full relative" />
}
