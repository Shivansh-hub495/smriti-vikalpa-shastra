import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Simple component to test responsive design
const ResponsiveTest = () => {
  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold">Responsive Design Test</h1>
      
      {/* Test responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Test Card {i}</p>
                  <p className="text-2xl lg:text-3xl font-bold text-blue-600">123</p>
                  <p className="text-xs text-gray-500">units</p>
                </div>
                <div className="p-2 lg:p-3 bg-blue-100 rounded-full">
                  <div className="h-5 w-5 lg:h-6 lg:w-6 bg-blue-600 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test responsive chart containers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl font-semibold text-gray-800">Chart 1</CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">Chart placeholder</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl font-semibold text-gray-800">Chart 2</CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">Chart placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test responsive 3-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-8">
        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl font-semibold text-gray-800">Wide Chart</CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">Wide chart placeholder</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl font-semibold text-gray-800">Narrow Chart</CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">Narrow chart placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakpoint indicators */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Current Breakpoint:</h2>
        <div className="flex gap-2">
          <div className="block sm:hidden px-3 py-1 bg-red-100 text-red-800 rounded">Mobile (< 640px)</div>
          <div className="hidden sm:block md:hidden px-3 py-1 bg-yellow-100 text-yellow-800 rounded">Small (640px - 768px)</div>
          <div className="hidden md:block lg:hidden px-3 py-1 bg-blue-100 text-blue-800 rounded">Medium (768px - 1024px)</div>
          <div className="hidden lg:block xl:hidden px-3 py-1 bg-green-100 text-green-800 rounded">Large (1024px - 1280px)</div>
          <div className="hidden xl:block px-3 py-1 bg-purple-100 text-purple-800 rounded">Extra Large (≥ 1280px)</div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTest;
