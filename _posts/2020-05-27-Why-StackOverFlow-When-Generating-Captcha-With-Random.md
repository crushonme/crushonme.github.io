---
layout: post
title: 为什么使用 Random 和递归生成随机验证码时会产生栈溢出
categories: dotnet
description: 
keywords: Random,Captcha,Stackoverflow
---

我们经常会收到应用在产生验证码时崩溃的问题，查看应用程序日志会发现都是栈溢出的问题导致的崩溃。总结下来，这些不同的应用都使用了类似的代码逻辑，即使用 Random 生成随机数，然后使用递归来生成多位随机验证码。猜测这些应用的开发都参考了同一篇文章。以下是两个简单的例子，一个生成 N 位非连续重复的数字型验证码，一个生成 N 个非连续重复的字符型验证码，可以通过代码看到两个函数功能类似，逻辑也基本一致。粗略一看这个函数定义是没有问题的，但为什么会在实际使用时产生栈溢出的问题呢？

```C#
static private string RandomNum(int n)
{
    string strchar = "0,1,2,3,4,5,6,7,8,9" ;
    string[] VcArray = strchar.Split(',') ;
    string  VNum = "" ;
    int temp = -1 ;

    Random rand =new Random();
    for ( int i = 1 ; i < n+1 ; i++ )
    {
        if ( temp != -1)
        {
            rand =new Random(i*temp*unchecked((int)DateTime.Now.Ticks));
        }
        int t=rand.Next(10);
        if (temp != -1 && temp == t)
        {
            return RandomNum(n);
        }
        temp = t  ;
        VNum += VcArray[t];
    }
    return VNum ;
}

static private string CreateRandomCaptcha(int NumCount)
{
    string text = \
    "A,B,C,D,E,F,G,H,I,J,K,L,N,M,O,P,Q,R,S,T,U,V,W,X,Y,Z";
    string[] array = text.Split(',');
    int num = -1;
    Random random = new Random();
    string result = "";
    for (int i = 0; i < NumCount; i++)
    {
        if (num != -1)
        {
            random = new Random(i * num * (int)DateTime.Now.Ticks);
        }
        int num2 = random.Next(26);
        if (num == num2)
        {
            return CreateRandomCaptcha(NumCount);
        }
        num = num2;
        result += array[num2];
    }
    return result;
}
```

对于这个问题的分析，如果我们直接抓取 DUMP 然后根据调用栈和堆中的数据，很难想到栈溢出的直接原因。但如果我们换一个角度，使用数学思维，从概率的角度入手，则很容易理解产生栈溢出的原因。

注意到上面两种生成 N 位不重复的验证码的方法中，是否递归取决于连续两次生成的字符或者数字是否相同，而这种方式存在一定概率需要一直递归才能生成满足条件的验证码。为了说明该问题，我们将原代码稍作修改，增加递归计数并且增加输入参数 N。通过修改后的代码很容易验证以下两个结论：

- N 越大，递归的次数越大，产生栈溢出的概率越大；

- 待选数组越长，递归的次数越小，产生栈溢出的概率越小；

```C#
using System;
using System.Threading;

namespace RandomNum
{
    class Program
    {
static int Reverse = 0;
static private string RandomNum(int n)
{
    Reverse++;
    string strchar = "0,1,2,3,4,5,6,7,8,9";
    string[] VcArray = strchar.Split(',');
    string VNum = "";
    int temp = -1;

    Random rand = new Random();
    for (int i = 1; i < n + 1; i++)
    {
        if (temp != -1)
        {
            rand = new Random(i * temp * \
            unchecked((int)DateTime.Now.Ticks));
        }
        int t = rand.Next(10);
        if (temp != -1 && temp == t)
        {
            return RandomNum(n);
        }
        temp = t;
        VNum += VcArray[t];
    }
    return VNum;
}

static private string CreateRandomCaptcha(int NumCount)
{
    Reverse++;
    string text = \
    "A,B,C,D,E,F,G,H,I,J,K,L,N,M,O,P,Q,R,S,T,U,V,W,X,Y,Z";
    string[] array = text.Split(',');
    int num = -1;
    Random random = new Random();
    string text2 = "";
    for (int i = 0; i < NumCount; i++)
    {
        if (num != -1)
        {
            random = new Random(i * num * (int)DateTime.Now.Ticks);
        }
        int num2 = random.Next(25);
        if (num == num2)
        {
            return CreateRandomCaptcha(NumCount);
        }
        num = num2;
        text2 += array[num2];
    }
    return text2;
}
static void Main(string[] args)
{
    int N = 6;//Default Value
    int TestCase = 0;
    string result = "";

    while (true)
    {

        Console.WriteLine("Please enter a numeric to \
        choose test cases.");
        Console.WriteLine("\t0 Create Random Captcha.");
        Console.WriteLine("\t1 Create Random Num Code.");
        Console.WriteLine("\t2 Create Random Num.");
        if (!int.TryParse(Console.ReadLine(), out TestCase) \
        || TestCase > 3)
            continue;
        else
            Console.WriteLine($"Test case {TestCase}");
        Console.WriteLine("Please enter a numeric to set N.");

        if (!int.TryParse(Console.ReadLine(), out N))
        {
            Console.WriteLine("You shoud enter a numeric\
                to set N.");
            continue;
        }else{
            Console.WriteLine($"N is {N}");
        }
        ConsoleKeyInfo cki;
        do
        {
            Console.WriteLine("\nPress a key to display;\
            press the 'x' key to quit.");
            while (Console.KeyAvailable == false)
            {
                switch (TestCase)
                {
                    case 1:
                        result = RandomNum(N);
                        break;

                    case 0:
                    default:
                        result = CreateRandomCaptcha(N);
                        break;

                }
                Console.WriteLine($"Reverse {Reverse} Times to\
                Create {N} bit Random Captcha: {result}");
                Reverse = 0;
                Thread.Sleep(20); //avoid same random series.
            }
            cki = Console.ReadKey(true);
            Console.WriteLine("You pressed the '{0}' key.", \
            cki.Key);
        } while (cki.Key != ConsoleKey.X);
    }
}
    }
}
```

那么对于这种问题如何解决呢？如果从原先的方案入手，最容易想到的避免栈溢出的方法是将递归改为循环。

```C#
static private  bool IsValid(string code)
{
    char[] array = code.ToCharArray();
    for (int i = 0; i < code.Length - 1; i++)
    {
        if (array[i] == array[i + 1])
            return false;
    }
    return true;
}
static private string CreateRandomNum(int codeCount)
{
    string format = string.Concat("D", codeCount.ToString());
    Random generator = new Random((int)DateTime.Now.Ticks);
    string n = "";
    int MaxThrold = Convert.ToInt32(\
    Math.Pow(10, Convert.ToDouble(codeCount))) - 1;
    int MinThrold = (MaxThrold + 1) / 10;
    do
    {
        n = generator.Next(MinThrold, MaxThrold).ToString(format);
        Reverse++;
    } while (!IsValid(n));

    return n;
}
static private string CreateRandomCaptchaLoop(int NumCount)
{
    string format = string.Concat("D", NumCount.ToString());
    Random generator = new Random((int)DateTime.Now.Ticks);
    string result = "";

    do
    {
        result = "";
        for (int i = 0; i < NumCount; i++)
        {
            result += Convert.ToChar(generator.Next(65, 90)).ToString();
        }

        Reverse++;
    } while (!IsValid(result));

    return result;
}
```

将递归改为循环，解决了栈溢出的问题，如果我们希望生成的不重复的随机验证码呢？我们该如何实现？实际也很简单，只用将判断有效性的代码稍作修改即可,即在验证前先判断当前的序列长度与不同元素的个数是否相等。

```C#
static private  bool IsValid(string code)
{
    char[] array = code.ToCharArray();
    if(array.Length != array.Distinct().Count())
        return false;
    for (int i = 0; i < code.Length - 1; i++)
    {
        if (array[i] == array[i + 1])
            return false;
    }
    return true;
}
```
