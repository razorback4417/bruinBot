import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import DropDown, { StudentType } from "../components/DropDown";
import Footer from "../components/Footer";
import Header from "../components/Header";
import LoadingDots from "../components/LoadingDots";

const Home: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [question, setAnswer] = useState("");
  const [student, setStudent] = useState<StudentType>("Incoming");
  const [generatedAnswers, setGeneratedAnswers] = useState<String>("");

  const questionRef = useRef<null | HTMLDivElement>(null);

  const scrollToAnswers = () => {
    if (questionRef.current !== null) {
      questionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const prompt = `Generate a factually correct answer for a ${student} student at UCLA. First, research information from the official UCLA site. Then try to find relavent information from students on social media. Finally, answer precisely and clearly labeled answers as "1." and "2.". ${
    student === "Transfer"
      ? "Make sure the answers are relavent for a transfering UCLA student. Include some specific information about transfer students."
      : null
  }
      Make sure each generated answer is less than 160 characters, has factual information found from UCLA sites. ${question}${
    question.slice(-1) === "." ? "" : "."
  }`;

  const generateAnswer = async (e: any) => {
    e.preventDefault();
    setGeneratedAnswers("");
    setLoading(true);
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      setGeneratedAnswers((prev) => prev + chunkValue);
    }
    scrollToAnswers();
    setLoading(false);
  };

  return (
    <div className="flex max-w-5xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
      <Head>
        <title>bruinBot</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-12 sm:mt-20">
        <h1 className="sm:text-6xl text-4xl max-w-[708px] font-bold text-slate-900">
          Answer all your questions about UCLA
        </h1>
        <p className="text-slate-500 mt-5"> 14 questions answered so far.</p>
        <div className="max-w-xl w-full">
          <div className="flex mt-10 items-center space-x-3">
            <Image
              src="/1-black.png"
              width={30}
              height={30}
              alt="1 icon"
              className="mb-5 sm:mb-0"
            />
            <p className="text-left font-medium">
              Ask a question about UCLA{" "}
              <span className="text-slate-500">
                (or anything about college in general)
              </span>
              .
            </p>
          </div>
          <textarea
            value={question}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black my-5"
            placeholder={
              "e.g. What are the best dining halls for dinner at UCLA?"
            }
          />
          <div className="flex mb-5 items-center space-x-3">
            <Image src="/2-black.png" width={30} height={30} alt="1 icon" />
            <p className="text-left font-medium">Select student type.</p>
          </div>
          <div className="block">
            <DropDown student={student} setStudent={(newStudent) => setStudent(newStudent)} />
          </div>

          {!loading && (
            <button
              className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
              onClick={(e) => generateAnswer(e)}
            >
              Ask your question &rarr;
            </button>
          )}
          {loading && (
            <button
              className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
              disabled
            >
              <LoadingDots color="white" style="large" />
            </button>
          )}
        </div>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{ duration: 2000 }}
        />
        <hr className="h-px bg-gray-700 border-1 dark:bg-gray-700" />
        <div className="space-y-10 my-10">
          {generatedAnswers && (
            <>
              <div>
                <h2
                  className="sm:text-4xl text-3xl font-bold text-slate-900 mx-auto"
                  ref={questionRef}
                >
                  bruinBot Answer:
                </h2>
              </div>
              <div className="space-y-8 flex flex-col items-center justify-center max-w-xl mx-auto">
                {generatedAnswers
                  .substring(generatedAnswers.indexOf("1") + 3)
                  .split("2.")
                  .map((generatedAnswer) => {
                    return (
                      <div
                        className="bg-white rounded-xl shadow-md p-4 hover:bg-gray-100 transition cursor-copy border"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedAnswer);
                          toast("Answer copied to clipboard", {
                            icon: "✂️",
                          });
                        }}
                        key={generatedAnswer}
                      >
                        <p>{generatedAnswer}</p>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
