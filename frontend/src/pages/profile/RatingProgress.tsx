// import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/Card";

export function RatingProgress() {
  return (
    <div className="space-y-6">
      {/* <Card className="bg-[#0a0a0a] border-neutral-900">
        <CardHeader>
          <CardTitle className="text-white">Rating Progress</CardTitle>
          <CardDescription className="text-neutral-500">
            Last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent> */}
          <div className="space-y-4">
            {/* Bullet */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs text-neutral-500 uppercase tracking-wide">
                  Bullet
                </span>
                <span className="text-lg font-bold text-white">1,987</span>
              </div>
              <div className="w-full bg-black rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-500 h-full"
                  style={{ width: "78%" }}
                />
              </div>
              <div className="text-xs text-green-500 mt-1 font-medium">
                +45 this month
              </div>
            </div>

            {/* Blitz */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs text-neutral-500 uppercase tracking-wide">
                  Blitz
                </span>
                <span className="text-lg font-bold text-white">2,145</span>
              </div>
              <div className="w-full bg-black rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-purple-500 h-full"
                  style={{ width: "85%" }}
                />
              </div>
              <div className="text-xs text-green-500 mt-1 font-medium">
                +28 this month
              </div>
            </div>

            {/* Rapid */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs text-neutral-500 uppercase tracking-wide">
                  Rapid
                </span>
                <span className="text-lg font-bold text-white">2,001</span>
              </div>
              <div className="w-full bg-black rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-600 to-green-500 h-full"
                  style={{ width: "82%" }}
                />
              </div>
              <div className="text-xs text-red-500 mt-1 font-medium">
                -12 this month
              </div>
            </div>
          </div>
        {/* </CardContent>
      </Card> */}
    </div>
  );
}