import React from 'react'
import ButtonLanding from './Button.landing'
import Hexagon from './Hexagon'

export default function Hero() {
    return (
        <section>
            <div className='py-24 md:py-48 '>
                <div className='w-full sticky z-20'>


                    <p className='uppercase font-extrabold text-center text-zinc-500 tracking-wider'>Introducing StaffTrack</p>
                    <h1 className=' font-black text-5xl text-center my-4 md:text-6xl lg:text-8xl lg:max-w-5xl mx-auto '>The Future of Attendance Tracking</h1>
                    <p className='text-center text-xl md:text-2xl mx-auto max-w-xl text-zinc-400'>Every minute counts! Streamline your workplace attendance with AI-driven analysis and metrics</p>
                    <div className="flex justify-center">
                        <ButtonLanding className={"mt-10 px-10"} ></ButtonLanding>
                    </div>





                </div>


                <div className="flex justify-center mt-24">


                    <div className="inline-flex  relative z-0">
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            <Hexagon className={"size-[1100px] -z-40"}></Hexagon>

                        </div>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            <Hexagon className={"size-[1800px] -z-40"}></Hexagon>

                        </div>


                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">

                            <div className=" bg-zinc-900 size-[240px]  rounded-full outline outline-[6px] outline-teal-500/10 -outline-offset-[6px]
                            inline-flex
                            items-center
                            justify-center  
                            absolute
                            -top-[900px]
                            left-[200px]
                            ">                            <img src="/src/assets/images/cube.png" alt="" className='size-[140px]' />
                            </div>

                        </div>

                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">

                            <div className=" bg-zinc-900 size-[240px]  rounded-full outline outline-[6px] outline-teal-500/10 -outline-offset-[6px]
                            inline-flex
                            items-center
                            justify-center  
                            absolute
                            top-[270px]
                            left-[200px]
                            ">                            <img src="/src/assets/images/cuboid.png" alt="" className='size-[140px]' />
                            </div>

                        </div>


                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">

                            <div className=" bg-zinc-900 size-[240px]  rounded-full outline outline-[6px] outline-teal-500/10 -outline-offset-[6px]
                            inline-flex
                            items-center
                            justify-center  
                            absolute
                            -top-[80px]
                            -left-[600px]
                            ">                            <img src="/src/assets/images/torus.png" alt="" className='size-[140px]' />
                            </div>

                        </div>

                        <img className='absolute w-[calc(100%+100px)] max-w-none -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 saturate-[10%] brightness-[4%] hue-rotate-[240deg]' src="/src/assets/images/icosahedron.png" alt="" />
                        <img className='w-[500px] ' src="/src/assets/images/icosahedron.png" />
                    </div>
                </div>
            </div>
        </section>
    )
}
