import building from '@/assets/building.png'

export default function UnderBuilding() {
  return (
    <div className="flex flex-col items-center h-screen p-4">
      <img src={building} alt="building" className="w-[500px] h-[390px]" />
      正在建设中...
    </div>
  )
}