---
title: "ValueComparer, Redux: Avoiding Boxing"
layout: "post"
categories: [C#, .Net, boxing, comparison, value-types]
---

A couple of years ago, I posted about a [`ValueComparer` class]({% post_url 2010-12-29-simplifying-value-comparison-semantics %}) to help implement `Equals()`, `GetHashCode()`, and `CompareTo()`.

{% raw %}
<div class="css-full-post-content js-full-post-content">
<p>Usually, you cannot pass <code>ref this</code> as a parameter, since <code>this</code> is not a writable field.&#160; However, that’s not true for value types.&#160; The <code>this</code> field of a value type is a <em>writable</em> value.</p>  <p>To quote the spec (§5.1.5)</p>  <blockquote>   <p>Within an instance method or instance accessor of a struct type, the <code>this</code> keyword behaves exactly as a reference parameter of the struct type (§7.6.7).</p> </blockquote>  <p>Therefore, the following code prints 1:</p>
{% endraw %}
{% highlight csharp %}
static void Main() {
    Mutable m = new Mutable();
    m.Mutate();
    Console.WriteLine(m.Value);
}

struct Mutable {
    public int Value;
    
    public void Mutate() {
        this = new Mutable(); 
        MutateStruct(ref this); 
    }
}
static void MutateStruct(ref Mutable m) { 
    m.Value++; 
}
{% endhighlight %}



However, this class 
http://stackoverflow.com/a/18066753/34397
GitHub project &Aacute; NuGet?